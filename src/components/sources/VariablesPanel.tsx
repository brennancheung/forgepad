'use client'

import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Plus, Braces } from 'lucide-react'
import { cn } from '@/lib/utils'
import { VariableList } from './VariableList'

interface VariablesPanelProps {
  scope: 'stack' | 'workspace' | 'user'
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
  className?: string
}

export function VariablesPanel({ scope, workspaceId, stackId, className }: VariablesPanelProps) {
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({})
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null)
  const [tempNewId] = useState(() => `new-${Date.now()}`)

  // Query sources based on scope
  const sources = useQuery(api.sources.queries.listSources, {
    scope,
    workspaceId,
    stackId,
  })

  const createSource = useMutation(api.sources.mutations.createSource)
  const updateSource = useMutation(api.sources.mutations.updateSource)
  const deleteSource = useMutation(api.sources.mutations.deleteSource)

  const handleExpandChange = useCallback(
    (id: string) => (open: boolean) => {
      setExpandedMap((m) => ({ ...m, [id]: open }))
    },
    []
  )

  const handleCreateSource = () => {
    setIsCreatingNew(true)
    setExpandedMap((m) => ({ ...m, [tempNewId]: true }))
  }

  // Clear lastCreatedId after a delay. Necessary for autofocus to work.
  useEffect(() => {
    if (lastCreatedId) {
      const timer = setTimeout(() => setLastCreatedId(null), 500)
      return () => clearTimeout(timer)
    }
  }, [lastCreatedId])

  const handleCreateNewSource = async (name: string, type: string, content?: string) => {
    const newSource = await createSource({
      name,
      type: 'array' as const,
      value: content ? JSON.parse(content) : [],
      workspaceId,
      stackId,
    })
    
    if (newSource) {
      setExpandedMap((m) => {
        const wasOpen = m[tempNewId] ?? true
        const { [tempNewId]: _, ...rest } = m
        return { ...rest, [newSource]: wasOpen }
      })
      setLastCreatedId(newSource)
      setIsCreatingNew(false)
    }
  }

  const handleUpdateSource = async (id: Id<'sources'>, name: string, type: string, content?: string) => {
    await updateSource({
      id,
      name,
      value: content ? JSON.parse(content) : []
    })
  }

  const handleDeleteSource = async (id: Id<'sources'>) => {
    await deleteSource({ id })
  }

  if (!sources) {
    return (
      <div className={cn("p-4", className)}>
        <p className="text-muted-foreground">Loading variables...</p>
      </div>
    )
  }

  const enumSources = sources
    .filter((s) => s.type === 'array')
    .sort((a, b) => a.createdAt - b.createdAt)

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">Variables</span>
          <Braces className="w-4 h-4 text-muted-foreground" />
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCreateSource}
          className="h-6 w-6 p-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="space-y-1">
        {enumSources.map((source) => (
          <VariableList
            key={source._id}
            isNew={false}
            initialSource={{
              id: source._id,
              name: source.name,
              type: source.type,
              content: JSON.stringify(source.value)
            }}
            onCreateSource={handleCreateNewSource}
            onUpdateSource={handleUpdateSource}
            onDeleteSource={handleDeleteSource}
            isExpanded={expandedMap[source._id] ?? true}
            onExpandChange={handleExpandChange(source._id)}
            autofocusAddInput={source._id === lastCreatedId}
          />
        ))}
        {isCreatingNew && (
          <VariableList
            key={tempNewId}
            isNew={true}
            onCreateSource={handleCreateNewSource}
            onUpdateSource={handleUpdateSource}
            onDeleteSource={handleDeleteSource}
            isExpanded={expandedMap[tempNewId] ?? true}
            onExpandChange={handleExpandChange(tempNewId)}
            autofocusAddInput={false}
          />
        )}
        {enumSources.length === 0 && !isCreatingNew && (
          <div className="px-2 py-8 text-center">
            <p className="text-sm text-muted-foreground">No variables yet</p>
          </div>
        )}
      </div>
    </div>
  )
}