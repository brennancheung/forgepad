'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Source, SourceScope, getSourceScope } from '@convex/types/sources'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Check, ChevronDown, FileText, List, Code, Plus, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Id } from '@convex/_generated/dataModel'

interface SourcePickerWidgetProps {
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
  value?: string // source name or ID
  onSelect: (source: Source, reference: string) => void
  onCreate?: () => void
  placeholder?: string
  className?: string
  disabled?: boolean
  showRecent?: boolean
  maxRecent?: number
  groupByScope?: boolean
  filter?: {
    type?: Source['type']
    scope?: SourceScope
  }
}

type ConvexSource = {
  _id: Id<'sources'>
  _creationTime: number
  userId: Id<'users'>
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
  name: string
  description?: string
  type: Source['type']
  value: unknown
  tags?: string[]
  createdAt: number
  updatedAt: number
}

const toSource = (source: ConvexSource): Source => ({
  ...source,
  value: source.value as Source['value']
})

const scopeBadgeColors: Record<SourceScope, string> = {
  user: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  workspace: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  stack: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

const typeIcons: Record<Source['type'], React.ReactNode> = {
  string: <FileText className="h-4 w-4" />,
  array: <List className="h-4 w-4" />,
  json: <Code className="h-4 w-4" />,
}

export function SourcePickerWidget({
  workspaceId,
  stackId,
  value,
  onSelect,
  onCreate,
  placeholder = "Search sources...",
  className,
  disabled,
  showRecent = true,
  maxRecent = 5,
  groupByScope = true,
  filter,
}: SourcePickerWidgetProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [recentSourceIds, setRecentSourceIds] = useState<string[]>([])
  const commandRef = useRef<HTMLDivElement>(null)

  // Load recent sources from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('forgepad-recent-sources')
    if (stored) {
      try {
        setRecentSourceIds(JSON.parse(stored))
      } catch {}
    }
  }, [])

  const convexSources = useQuery(api.sources.queries.listSources, {
    workspaceId,
    stackId,
    type: filter?.type,
    scope: filter?.scope,
  })

  const sources = useMemo(() => 
    convexSources?.map(toSource) || [], 
    [convexSources]
  )

  const filteredSources = useMemo(() => {
    if (!search) return sources
    
    const searchLower = search.toLowerCase()
    return sources.filter(source => 
      source.name.toLowerCase().includes(searchLower) ||
      source.description?.toLowerCase().includes(searchLower) ||
      source.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }, [sources, search])

  const groupedSources = useMemo(() => {
    if (!groupByScope) return { all: filteredSources }
    
    const groups: Record<SourceScope | 'all', Source[]> = {
      all: [],
      stack: [],
      workspace: [],
      user: [],
    }
    
    filteredSources.forEach(source => {
      const scope = getSourceScope(source)
      groups[scope].push(source)
    })
    
    return groups
  }, [filteredSources, groupByScope])

  const recentSources = useMemo(() => {
    if (!showRecent || recentSourceIds.length === 0) return []
    
    return recentSourceIds
      .map(id => sources.find(s => s._id === id))
      .filter((s): s is Source => s !== undefined)
      .slice(0, maxRecent)
  }, [sources, recentSourceIds, showRecent, maxRecent])

  const selectedSource = sources.find(s => s.name === value || s._id === value)

  const handleSelect = (source: Source) => {
    // Add to recent
    const newRecent = [source._id, ...recentSourceIds.filter(id => id !== source._id)].slice(0, 10)
    setRecentSourceIds(newRecent)
    localStorage.setItem('forgepad-recent-sources', JSON.stringify(newRecent))
    
    // Generate reference based on scope
    const scope = getSourceScope(source)
    const reference = scope === 'user' 
      ? `{{source:${source.name}}}`
      : `{{${scope}:${source.name}}}`
    
    onSelect(source, reference)
    setOpen(false)
    setSearch('')
  }

  const renderSourceItem = (source: Source, showScope = true) => {
    const scope = getSourceScope(source)
    const isSelected = selectedSource?._id === source._id
    
    return (
      <CommandItem
        key={source._id}
        value={`${source.name} ${source.description || ''} ${source.tags?.join(' ') || ''}`}
        onSelect={() => handleSelect(source)}
        className="flex items-center gap-2 px-2 py-1.5"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {typeIcons[source.type]}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-medium truncate">{source.name}</span>
              {showScope && (
                <Badge 
                  variant="secondary" 
                  className={cn('text-[10px] px-1 py-0', scopeBadgeColors[scope])}
                >
                  {scope[0].toUpperCase()}
                </Badge>
              )}
            </div>
            {source.description && (
              <p className="text-xs text-muted-foreground truncate">
                {source.description}
              </p>
            )}
          </div>
        </div>
        {isSelected && <Check className="h-4 w-4 text-primary" />}
      </CommandItem>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('justify-between', className)}
          disabled={disabled}
        >
          {selectedSource ? (
            <div className="flex items-center gap-2 truncate">
              {typeIcons[selectedSource.type]}
              <span className="truncate">{selectedSource.name}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">Select source...</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command ref={commandRef}>
          <CommandInput 
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <ScrollArea className="h-[300px]">
              <CommandEmpty>
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-2">
                    No sources found
                  </p>
                  {onCreate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOpen(false)
                        onCreate()
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create new source
                    </Button>
                  )}
                </div>
              </CommandEmpty>

              {showRecent && recentSources.length > 0 && !search && (
                <>
                  <CommandGroup heading={
                    <div className="flex items-center gap-1.5 text-xs">
                      <Clock className="h-3 w-3" />
                      Recent
                    </div>
                  }>
                    {recentSources.map(source => renderSourceItem(source))}
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}

              {groupByScope ? (
                <>
                  {(['stack', 'workspace', 'user'] as SourceScope[]).map(scope => {
                    const sources = scope in groupedSources ? groupedSources[scope as keyof typeof groupedSources] : []
                    if (!sources || sources.length === 0) return null
                    
                    return (
                      <CommandGroup 
                        key={scope}
                        heading={
                          <div className="flex items-center gap-1.5 text-xs capitalize">
                            <Badge 
                              variant="secondary" 
                              className={cn('text-[10px] px-1.5 py-0', scopeBadgeColors[scope])}
                            >
                              {scope}
                            </Badge>
                            <span className="text-muted-foreground">
                              ({sources.length})
                            </span>
                          </div>
                        }
                      >
                        {sources.map((source: Source) => renderSourceItem(source, false))}
                      </CommandGroup>
                    )
                  })}
                </>
              ) : (
                <CommandGroup>
                  {filteredSources.map(source => renderSourceItem(source))}
                </CommandGroup>
              )}

              {onCreate && filteredSources.length > 0 && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false)
                        onCreate()
                      }}
                      className="justify-center text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create new source
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}