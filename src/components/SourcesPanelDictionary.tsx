'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { InlineJSONEditor } from '@/components/common/InlineJSONEditor'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SourcesPanelDictionaryProps {
  scope: 'stack' | 'workspace' | 'user'
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
  className?: string
}

export function SourcesPanelDictionary({ scope, workspaceId, stackId, className }: SourcesPanelDictionaryProps) {
  const [editingId, setEditingId] = useState<Id<'sources'> | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newValue, setNewValue] = useState('{}')
  const [newValueValid, setNewValueValid] = useState(true)

  // Query sources based on scope
  const sources = useQuery(api.sources.queries.listSources, {
    scope,
    workspaceId,
    stackId,
  })

  const createSource = useMutation(api.sources.mutations.createSource)
  const updateSource = useMutation(api.sources.mutations.updateSource)
  const deleteSource = useMutation(api.sources.mutations.deleteSource)

  const handleEdit = useCallback((source: NonNullable<typeof sources>[0]) => {
    setEditingId(source._id)
    setEditingValue(
      source.type === 'string' 
        ? JSON.stringify(source.value)
        : JSON.stringify(source.value, null, 2)
    )
  }, [])

  const handleSave = useCallback(async () => {
    if (!editingId || !editingValue) return

    try {
      const parsedValue = JSON.parse(editingValue)
      await updateSource({
        id: editingId,
        value: parsedValue
      })
      setEditingId(null)
      setEditingValue('')
    } catch (error) {
      console.error('Failed to save source:', error)
    }
  }, [editingId, editingValue, updateSource])

  const _handleCancel = useCallback(() => {
    setEditingId(null)
    setEditingValue('')
  }, [])

  const handleAdd = useCallback(async () => {
    if (!newName || !newValue || !newValueValid) return

    try {
      const parsedValue = JSON.parse(newValue)
      
      // Determine type based on parsed value
      let type: 'string' | 'array' | 'json' = 'json'
      if (typeof parsedValue === 'string') {
        type = 'string'
      } else if (Array.isArray(parsedValue)) {
        type = 'array'
      }

      await createSource({
        name: newName,
        type,
        value: parsedValue,
        workspaceId,
        stackId,
      })

      setIsAdding(false)
      setNewName('')
      setNewValue('{}')
      setNewValueValid(true)
    } catch (error) {
      console.error('Failed to create source:', error)
    }
  }, [newName, newValue, newValueValid, workspaceId, stackId, createSource])

  const handleDelete = useCallback(async (id: Id<'sources'>) => {
    try {
      await deleteSource({ id })
    } catch (error) {
      console.error('Failed to delete source:', error)
    }
  }, [deleteSource])

  const renderValue = (value: unknown) => {
    const stringified = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
    const lines = stringified.split('\n')
    const truncated = lines.length > 3 
      ? lines.slice(0, 3).join('\n') + '\n...' 
      : stringified
    return truncated
  }

  if (!sources) {
    return (
      <div className={cn("p-4", className)}>
        <p className="text-muted-foreground">Loading sources...</p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Sources ({scope})</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsAdding(true)}
          disabled={isAdding}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {sources.length === 0 && !isAdding && (
        <p className="text-sm text-muted-foreground p-4">
          No sources defined. Click + to add.
        </p>
      )}

      <div className="space-y-1">
        {sources.map((source) => (
          <div
            key={source._id}
            className="group grid grid-cols-[200px_1fr_auto] gap-2 p-2 hover:bg-accent/50 rounded"
          >
            <div className="font-mono text-sm truncate" title={source.name}>
              {source.name}
            </div>
            
            {editingId === source._id ? (
              <InlineJSONEditor
                value={editingValue}
                onChange={(value, isValid) => {
                  setEditingValue(value)
                  if (isValid && value.trim()) {
                    handleSave()
                  }
                }}
                minHeight={1}
                maxHeight={6}
                className="text-sm"
              />
            ) : (
              <div
                className="text-sm cursor-pointer hover:bg-accent rounded px-2 py-1"
                onClick={() => handleEdit(source)}
              >
                <pre className="whitespace-pre-wrap break-words">
                  {renderValue(source.value)}
                </pre>
              </div>
            )}

            <Button
              size="sm"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
              onClick={() => handleDelete(source._id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {isAdding && (
          <div className="grid grid-cols-[200px_1fr] gap-2 p-2 bg-accent/50 rounded">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Source name"
              className={cn(
                "px-2 py-1 text-sm font-mono rounded",
                "bg-background border border-input",
                "focus:outline-none focus:ring-2 focus:ring-ring"
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newName && newValueValid) {
                  handleAdd()
                } else if (e.key === 'Escape') {
                  setIsAdding(false)
                  setNewName('')
                  setNewValue('{}')
                }
              }}
              autoFocus
            />
            <InlineJSONEditor
              value={newValue}
              onChange={(value, isValid) => {
                setNewValue(value)
                setNewValueValid(isValid)
              }}
              minHeight={1}
              maxHeight={6}
              className="text-sm"
            />
          </div>
        )}
      </div>
    </div>
  )
}