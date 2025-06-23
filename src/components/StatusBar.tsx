'use client'

import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { usePathname } from 'next/navigation'
import { Id } from '@convex/_generated/dataModel'
import { formatDistanceToNow } from 'date-fns'
import { useKeyboard } from '@/lib/keyboard'

export function StatusBar() {
  const pathname = usePathname()
  const workspaceId = pathname.match(/\/workspace\/([^/]+)/)?.[1] as Id<'workspaces'> | undefined
  const keyboard = useKeyboard()

  const workspace = useQuery(api.workspaces.get, workspaceId ? { id: workspaceId } : 'skip')

  const _stacks = useQuery(api.stacks.listByWorkspace, workspaceId ? { workspaceId } : 'skip')

  const _lastUpdated = workspace?.updatedAt
    ? formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })
    : null

  // Count total cells across all stacks
  const _totalCells = _stacks?.reduce((sum, stack) => sum + stack.cells.length, 0) || 0

  const inflightRequests = []
  const activeStack = '∅'

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
      {/* Active Workspace */}
      {workspace && (
        <>
          <span className="font-semibold text-foreground">{workspace.name}</span>

          {/* Current Mode (similar to vim) */}
          <span className="text-border">│</span>
          <span className={keyboard.mode === 'visual' ? 'text-yellow-500' : ''}>
            {keyboard.mode.toUpperCase()}
          </span>

          {/* Stack Position */}
          {keyboard.stackDepth > 0 && (
            <>
              <span className="text-border">│</span>
              <span>
                {keyboard.visualSelection ? (
                  `${Math.min(keyboard.visualSelection.start, keyboard.visualSelection.end)}-${Math.max(keyboard.visualSelection.start, keyboard.visualSelection.end)}/${keyboard.stackDepth}`
                ) : (
                  `${keyboard.stackPosition}/${keyboard.stackDepth}`
                )}
              </span>
            </>
          )}

          {/* Command Buffer or Search Pattern */}
          {keyboard.mode === 'search' && keyboard.searchPattern !== undefined ? (
            <>
              <span className="text-border">│</span>
              <span className="text-yellow-500">/{keyboard.searchPattern}</span>
            </>
          ) : keyboard.commandBuffer ? (
            <>
              <span className="text-border">│</span>
              <span className="text-yellow-500">{keyboard.commandBuffer}</span>
            </>
          ) : null}

          {/* Active Stack*/}
          <span className="text-border">│</span>
          <span></span>
          <span>active stack: {activeStack || ''}</span>


          <div className="ml-auto flex items-center gap-3">
            {/* In-flight requests: */}
            <span>{inflightRequests?.length || 0} inflight requests</span>
          </div>
        </>
      )}

      {/* Default state when no workspace is selected */}
      {!workspace && pathname === '/dashboard' && <span>No workspace selected</span>}
    </div>
  )
}
