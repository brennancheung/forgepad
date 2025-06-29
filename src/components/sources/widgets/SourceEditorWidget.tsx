'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Source, SourceValue } from '@convex/types/sources'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Loader2, Save, Trash2, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Id } from '@convex/_generated/dataModel'
import {
  validateSourceName,
  getSourceNameError,
  getSourceValueError,
} from '@convex/sources/validation'
import { StringEditor } from './editors/StringEditor'
import { SourceArrayEditor } from './editors/SourceArrayEditor'
import { JsonEditor } from './editors/JsonEditor'

interface SourceEditorWidgetProps {
  sourceId?: Id<'sources'>
  source?: Source
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
  onSave?: (source: Source) => void
  onCancel?: () => void
  onDelete?: () => void
  className?: string
  mode?: 'modal' | 'inline' | 'panel'
}

export function SourceEditorWidget({
  sourceId,
  source: initialSource,
  workspaceId,
  stackId,
  onSave,
  onCancel,
  onDelete,
  className,
  mode = 'modal',
}: SourceEditorWidgetProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [value, setValue] = useState<SourceValue>('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'usage'>('edit')
  
  const updateSource = useMutation(api.sources.mutations.updateSource)
  const deleteSourceMutation = useMutation(api.sources.mutations.deleteSource)
  const duplicateSource = useMutation(api.sources.mutations.duplicateSource)
  
  // Fetch source if only ID provided
  const fetchedSource = useQuery(
    api.sources.queries.getSource,
    sourceId && !initialSource ? { id: sourceId } : 'skip'
  )
  
  const source = initialSource || fetchedSource
  
  // Fetch references for usage tab
  const references = useQuery(
    api.sources.queries.getSourceReferences,
    source ? { sourceId: source._id } : 'skip'
  )

  useEffect(() => {
    if (source) {
      setName(source.name)
      setDescription(source.description || '')
      setValue(source.value)
      setTags(source.tags || [])
    }
  }, [source])

  const handleSave = async () => {
    if (!source) return
    
    // Validate name if changed
    if (name !== source.name) {
      const nameError = getSourceNameError(name)
      if (nameError) {
        toast.error(nameError)
        return
      }
    }

    // Validate value
    const valueError = getSourceValueError(source.type, value)
    if (valueError) {
      toast.error(valueError)
      return
    }

    setIsSubmitting(true)
    try {
      await updateSource({
        id: source._id,
        name: name !== source.name ? name : undefined,
        description,
        value,
        tags,
      })
      
      toast.success('Source updated successfully')
      onSave?.({ ...source, name, description, value, tags })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update source')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!source) return
    
    setIsSubmitting(true)
    try {
      await deleteSourceMutation({ id: source._id })
      toast.success('Source deleted successfully')
      onDelete?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete source')
    } finally {
      setIsSubmitting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleDuplicate = async () => {
    if (!source) return
    
    const newName = `${name}-copy`
    setIsSubmitting(true)
    try {
      await duplicateSource({
        sourceId: source._id,
        newName,
        newWorkspaceId: workspaceId,
        newStackId: stackId,
      })
      toast.success(`Source duplicated as "${newName}"`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to duplicate source')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const getScopeLabel = () => {
    if (!source) return ''
    if (source.stackId) return 'Stack'
    if (source.workspaceId) return 'Workspace'
    return 'User'
  }

  const hasChanges = () => {
    if (!source) return false
    return (
      name !== source.name ||
      description !== (source.description || '') ||
      JSON.stringify(value) !== JSON.stringify(source.value) ||
      JSON.stringify(tags) !== JSON.stringify(source.tags || [])
    )
  }

  if (!source) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const renderValueEditor = () => {
    switch (source.type) {
      case 'string':
        return (
          <StringEditor
            value={value as string}
            onChange={setValue}
            disabled={isSubmitting}
          />
        )
      case 'array':
        return (
          <SourceArrayEditor
            items={value}
            onItemsChange={(items) => setValue(items as SourceValue)}
            disabled={isSubmitting}
          />
        )
      case 'json':
        return (
          <JsonEditor
            value={value as Record<string, unknown>}
            onChange={setValue}
            disabled={isSubmitting}
          />
        )
    }
  }

  const content = (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Edit Source</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="text-xs">
              {getScopeLabel()} scope
            </Badge>
            <Badge variant="outline" className="text-xs">
              {source.type}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDuplicate}
            disabled={isSubmitting}
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isSubmitting || (references && references.length > 0)}
            title={references && references.length > 0 ? 'Cannot delete: source is referenced' : 'Delete'}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="usage">Usage ({references?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
            {name !== source.name && !validateSourceName(name) && (
              <p className="text-sm text-destructive">
                {getSourceNameError(name)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={2}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Value</Label>
            {renderValueEditor()}
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add tag..."
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={isSubmitting || !tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2">Source Reference</h4>
            <code className="text-sm bg-muted px-2 py-1 rounded">
              {`{{source:${name}}}`}
            </code>
          </div>
          
          <div className="rounded-lg border p-4">
            <h4 className="font-medium mb-2">Value Preview</h4>
            <ScrollArea className="h-[300px]">
              <pre className="text-sm">
                {typeof value === 'string'
                  ? value
                  : JSON.stringify(value, null, 2)}
              </pre>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          {references && references.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {references.map((cell) => (
                  <div key={cell._id} className="rounded-lg border p-3">
                    <div className="text-sm font-medium">Cell {cell.type}</div>
                    <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                      {cell.content.substring(0, 200)}
                      {cell.content.length > 200 && '...'}
                    </pre>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>This source is not referenced in any cells</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSubmitting || !hasChanges()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Source</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{source.name}&quot;? This action cannot be undone.
              {references && references.length > 0 && (
                <span className="block mt-2 text-destructive">
                  Warning: This source is referenced in {references.length} cell(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

  if (mode === 'inline') {
    return content
  }

  return (
    <div className={cn(
      'bg-background',
      mode === 'panel' && 'h-full overflow-auto p-4',
      mode === 'modal' && 'p-0',
      className
    )}>
      {content}
    </div>
  )
}