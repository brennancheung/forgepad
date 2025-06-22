'use client'

import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { usePathname } from 'next/navigation'
import { Id } from '@convex/_generated/dataModel'
import { formatDistanceToNow } from 'date-fns'

export function StatusBar() {
  const pathname = usePathname()
  const workspaceId = pathname.match(/\/workspace\/([^/]+)/)?.[1] as Id<'workspaces'> | undefined
  
  const workspace = useQuery(
    api.workspaces.get, 
    workspaceId ? { id: workspaceId } : 'skip'
  )
  
  const stacks = useQuery(
    api.stacks.listByWorkspace,
    workspaceId ? { workspaceId } : 'skip'
  )

  // Format the last updated time
  const lastUpdated = workspace?.updatedAt 
    ? formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })
    : null

  // Count total cells across all stacks
  const totalCells = stacks?.reduce((sum, stack) => sum + stack.cells.length, 0) || 0

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
      {/* Active Workspace */}
      {workspace && (
        <>
          <span className="font-semibold text-foreground">{workspace.name}</span>
          
          <span className="text-border">│</span>
          
          {/* Stack/Cell Count */}
          <span>
            {stacks?.length || 0} stacks, {totalCells} cells
          </span>
          
          {/* Status indicators */}
          <span className="text-border">│</span>
          <span>NORMAL</span>
          
          {/* Last Updated - right aligned */}
          <div className="ml-auto flex items-center gap-3">
            <span className="text-border">│</span>
            <span>{lastUpdated}</span>
          </div>
        </>
      )}
      
      {/* Default state when no workspace is selected */}
      {!workspace && pathname === '/dashboard' && (
        <span>No workspace selected</span>
      )}
    </div>
  )
}