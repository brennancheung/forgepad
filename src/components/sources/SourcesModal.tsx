'use client'

import { useState, useEffect, useContext } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { KeyboardContext } from '@/lib/keyboard/keyboardProvider'
import { Button } from '@/components/ui/button'
import { Id } from '@convex/_generated/dataModel'
import { Source } from '@convex/types/sources'
import { toast } from 'sonner'
import { 
  SourceListWidget, 
  SourceQuickAddWidget, 
  SourceEditorWidget,
  SourcePickerWidget 
} from './widgets'

interface SourcesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
  mode?: 'manage' | 'picker'
  onSelectSource?: (source: Source, reference: string) => void
}

export function SourcesModal({
  open,
  onOpenChange,
  workspaceId,
  stackId,
  mode = 'manage',
  onSelectSource
}: SourcesModalProps) {
  const [editingSource, setEditingSource] = useState<Source | null>(null)
  const [selectedSource, setSelectedSource] = useState<Source | null>(null)
  const [creatingSource, setCreatingSource] = useState(false)
  const keyboardContext = useContext(KeyboardContext)
  
  // Switch keyboard mode when modal opens/closes
  useEffect(() => {
    keyboardContext?.setMode(open ? 'insert' : 'normal')
  }, [open, keyboardContext])

  const handleSourceSelect = (source: Source) => {
    if (mode === 'picker' && onSelectSource) {
      // Generate the reference string
      const reference = source.stackId 
        ? `{{stack:${source.name}}}`
        : source.workspaceId
        ? `{{workspace:${source.name}}}`
        : `{{user:${source.name}}}`
      
      onSelectSource(source, reference)
      onOpenChange(false)
    } else {
      setSelectedSource(source)
    }
  }

  const handleQuickAddComplete = (sourceId: Id<'sources'>) => {
    console.log('Created source:', sourceId)
    setCreatingSource(false)
  }

  const handleEditComplete = (source: Source) => {
    console.log('Updated source:', source)
    setEditingSource(null)
    if (selectedSource?._id === source._id) {
      setSelectedSource(source)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[800px] sm:max-w-[800px]">
        <SheetHeader>
          <SheetTitle>
            {mode === 'picker' ? 'Select a Source' : 'Manage Sources'}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 px-6">
          {(() => {
            if (editingSource) {
              return (
                <SourceEditorWidget
                  source={editingSource}
                  workspaceId={workspaceId}
                  stackId={stackId}
                  onSave={handleEditComplete}
                  onCancel={() => setEditingSource(null)}
                  onDelete={() => {
                    setEditingSource(null)
                    if (selectedSource?._id === editingSource._id) {
                      setSelectedSource(null)
                    }
                  }}
                  mode="inline"
                />
              )
            }
            
            if (creatingSource) {
              return (
                <SourceQuickAddWidget
                  workspaceId={workspaceId}
                  stackId={stackId}
                  onComplete={handleQuickAddComplete}
                  onCancel={() => setCreatingSource(false)}
                />
              )
            }
            
            // Browse mode
            return (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <SourceListWidget
                    workspaceId={workspaceId}
                    stackId={stackId}
                    showInherited={true}
                    onQuickAdd={() => setCreatingSource(true)}
                    onEdit={(source) => setEditingSource(source)}
                    onSelect={handleSourceSelect}
                    className="h-[500px]"
                    maxHeight="500px"
                  />
                </div>

                <div className="space-y-4">
                  {mode === 'picker' && (
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <h3 className="font-medium mb-2">Quick Select</h3>
                      <SourcePickerWidget
                        workspaceId={workspaceId}
                        stackId={stackId}
                        value=""
                        onSelect={(source, reference) => {
                          if (onSelectSource) {
                            onSelectSource(source, reference)
                            onOpenChange(false)
                          }
                        }}
                        onCreate={() => setCreatingSource(true)}
                        showRecent={true}
                        groupByScope={true}
                      />
                    </div>
                  )}

                  {selectedSource && mode === 'manage' && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-3">Source Details</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium">Name:</span> {selectedSource.name}
                        </div>
                        <div>
                          <span className="font-medium">Type:</span> {selectedSource.type}
                        </div>
                        <div>
                          <span className="font-medium">Scope:</span>{' '}
                          {selectedSource.stackId ? 'Stack' : selectedSource.workspaceId ? 'Workspace' : 'User'}
                        </div>
                        {selectedSource.description && (
                          <div>
                            <span className="font-medium">Description:</span> {selectedSource.description}
                          </div>
                        )}
                        <div className="mt-3">
                          <span className="font-medium">Value:</span>
                          <pre className="mt-2 p-3 bg-muted rounded-md overflow-auto max-h-[200px] text-xs">
                            {typeof selectedSource.value === 'string'
                              ? selectedSource.value
                              : JSON.stringify(selectedSource.value, null, 2)}
                          </pre>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            onClick={() => setEditingSource(selectedSource)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const reference = selectedSource.stackId 
                                ? `{{stack:${selectedSource.name}}}`
                                : selectedSource.workspaceId
                                ? `{{workspace:${selectedSource.name}}}`
                                : `{{user:${selectedSource.name}}}`
                              navigator.clipboard.writeText(reference)
                              toast.success('Source reference copied to clipboard')
                            }}
                          >
                            Copy Reference
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      </SheetContent>
    </Sheet>
  )
}