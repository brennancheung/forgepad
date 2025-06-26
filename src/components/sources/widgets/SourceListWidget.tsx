'use client'

import { useState, useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Source, SourceScope, SourceType, SourceValue, getSourceScope } from '@convex/types/sources'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  FileText, 
  List, 
  Code,
  ChevronDown,
  SortAsc,
  SortDesc,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Id } from '@convex/_generated/dataModel'

interface SourceListWidgetProps {
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
  showInherited?: boolean
  onEdit?: (source: Source) => void
  onQuickAdd?: () => void
  onSelect?: (source: Source) => void
  className?: string
  maxHeight?: string
}

type SortOption = 'name' | 'date' | 'type' | 'scope'
type SortOrder = 'asc' | 'desc'

const scopeBadgeColors: Record<SourceScope, string> = {
  user: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  workspace: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  stack: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
}

const typeIcons: Record<SourceType, React.ReactNode> = {
  string: <FileText className="h-4 w-4" />,
  array: <List className="h-4 w-4" />,
  json: <Code className="h-4 w-4" />,
}

// Type helper to ensure proper typing
type ConvexSource = {
  _id: Id<'sources'>
  _creationTime: number
  userId: Id<'users'>
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
  name: string
  description?: string
  type: SourceType
  value: unknown
  tags?: string[]
  createdAt: number
  updatedAt: number
}

const toSource = (source: ConvexSource): Source => ({
  ...source,
  value: source.value as SourceValue
})

export function SourceListWidget({
  workspaceId,
  stackId,
  showInherited = true,
  onEdit,
  onQuickAdd,
  onSelect,
  className,
  maxHeight = '400px',
}: SourceListWidgetProps) {
  const [search, setSearch] = useState('')
  const [scopeFilter, setScopeFilter] = useState<SourceScope | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<SourceType | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortOption>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  const convexSources = useQuery(api.sources.queries.listSources, {
    workspaceId,
    stackId,
    scope: scopeFilter === 'all' ? undefined : scopeFilter,
    type: typeFilter === 'all' ? undefined : typeFilter,
    search: search.length > 0 ? search : undefined,
  })
  
  const sources = convexSources?.map(toSource)

  const sortedSources = useMemo(() => {
    if (!sources) return []
    
    return [...sources].sort((a, b) => {
      let compareValue = 0
      
      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name)
          break
        case 'date':
          compareValue = b.updatedAt - a.updatedAt
          break
        case 'type':
          compareValue = a.type.localeCompare(b.type)
          break
        case 'scope':
          const scopeA = getSourceScope(a)
          const scopeB = getSourceScope(b)
          compareValue = scopeA.localeCompare(scopeB)
          break
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue
    })
  }, [sources, sortBy, sortOrder])

  const groupedSources = useMemo(() => {
    const groups: Record<SourceScope, Source[]> = {
      stack: [],
      workspace: [],
      user: [],
    }
    
    sortedSources.forEach(source => {
      const scope = getSourceScope(source)
      groups[scope].push(source)
    })
    
    return groups
  }, [sortedSources])

  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(option)
      setSortOrder('asc')
    }
  }

  if (!sources) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const renderSourceCard = (source: Source) => {
    const scope = getSourceScope(source)
    const isInherited = showInherited && (
      (scope === 'user' && (workspaceId || stackId)) ||
      (scope === 'workspace' && stackId)
    )

    return (
      <Card
        key={source._id}
        className={cn(
          'p-3 cursor-pointer hover:bg-accent/50 transition-colors',
          isInherited && 'opacity-70'
        )}
        onClick={() => onSelect?.(source)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="mt-0.5">{typeIcons[source.type]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium truncate">{source.name}</h4>
                <Badge 
                  variant="secondary" 
                  className={cn('text-xs', scopeBadgeColors[scope])}
                >
                  {scope[0].toUpperCase()}
                </Badge>
              </div>
              {source.description && (
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {source.description}
                </p>
              )}
              {source.tags && source.tags.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap">
                  {source.tags.slice(0, 3).map((tag: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {source.tags.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{source.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {onEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(source)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuItem>Move to...</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="space-y-3 pb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Sources</h3>
          {onQuickAdd && (
            <Button size="sm" onClick={onQuickAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search sources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center gap-2">
          <Tabs
            value={scopeFilter}
            onValueChange={(v) => setScopeFilter(v as SourceScope | 'all')}
          >
            <TabsList className="h-8">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="user" className="text-xs">User</TabsTrigger>
              <TabsTrigger value="workspace" className="text-xs">Workspace</TabsTrigger>
              <TabsTrigger value="stack" className="text-xs">Stack</TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-3 w-3 mr-1" />
                Type
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTypeFilter('all')}>
                All types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('string')}>
                <FileText className="h-4 w-4 mr-2" />
                String
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('array')}>
                <List className="h-4 w-4 mr-2" />
                Array
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter('json')}>
                <Code className="h-4 w-4 mr-2" />
                JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {sortOrder === 'asc' ? (
                  <SortAsc className="h-3 w-3 mr-1" />
                ) : (
                  <SortDesc className="h-3 w-3 mr-1" />
                )}
                Sort
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleSort('name')}>
                By name
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('date')}>
                By date
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('type')}>
                By type
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSort('scope')}>
                By scope
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Source List */}
      <ScrollArea className="flex-1" style={{ maxHeight }}>
        {sortedSources.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No sources found</p>
            {onQuickAdd && (
              <Button
                variant="link"
                size="sm"
                onClick={onQuickAdd}
                className="mt-2"
              >
                Create your first source
              </Button>
            )}
          </div>
        ) : scopeFilter === 'all' ? (
          <div className="space-y-4">
            {(['stack', 'workspace', 'user'] as SourceScope[]).map(scope => {
              const sources = groupedSources[scope]
              if (sources.length === 0) return null
              
              return (
                <div key={scope}>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                    {scope} Sources ({sources.length})
                  </h4>
                  <div className="space-y-2">
                    {sources.map(renderSourceCard)}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedSources.map(renderSourceCard)}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}