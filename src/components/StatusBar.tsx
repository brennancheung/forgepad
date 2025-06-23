'use client'

import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { usePathname } from 'next/navigation'
import { Id } from '@convex/_generated/dataModel'
import { formatDistanceToNow } from 'date-fns'
import { useKeyboard } from '@/lib/keyboard'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export function StatusBar() {
  const pathname = usePathname()
  const workspaceId = pathname.match(/\/workspace\/([^/]+)/)?.[1] as Id<'workspaces'> | undefined
  
  // Track keyboard mode locally
  const [mode, setMode] = useState<'normal' | 'insert' | 'visual' | 'command' | 'search'>('normal')
  const [commandBuffer, setCommandBuffer] = useState('')
  
  const keyboard = useKeyboard({
    onKeyboardCommand: (command) => {
      // Listen for mode changes
      if (command.type === 'MODE_CHANGE') {
        setMode(command.mode)
      }
      // Listen for command buffer updates
      if (command.type === 'COMMAND_BUFFER_UPDATE') {
        setCommandBuffer(command.buffer)
      }
    }
  })

  const workspace = useQuery(api.workspaces.get, workspaceId ? { id: workspaceId } : 'skip')

  const _stacks = useQuery(api.stacks.listByWorkspace, workspaceId ? { workspaceId } : 'skip')

  const _lastUpdated = workspace?.updatedAt
    ? formatDistanceToNow(new Date(workspace.updatedAt), { addSuffix: true })
    : null

  // Count total cells across all stacks
  const _totalCells = _stacks?.reduce((sum, stack) => sum + stack.cellCount, 0) || 0

  const inflightRequests = []
  const activeStack = '∅'
  
  const modeColors = {
    normal: 'bg-blue-600',
    insert: 'bg-green-600',
    visual: 'bg-orange-600',
    command: 'bg-purple-600',
    search: 'bg-yellow-600'
  } as const
  

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
      {/* Current Mode (always show) */}
      <div className={cn(
        "px-2 py-0.5 rounded text-xs font-bold text-white",
        modeColors[mode]
      )}>
        {mode.toUpperCase()}
      </div>
      
      
      {/* Command Buffer */}
      {commandBuffer && (
        <>
          <span className="text-border">│</span>
          <span className="text-yellow-500">{commandBuffer}</span>
        </>
      )}
      
      {/* Active Workspace */}
      {workspace && (
        <>
          <span className="text-border">│</span>
          <span className="font-semibold text-foreground">{workspace.name}</span>



          {/* Active Stack*/}
          <span className="text-border">│</span>
          <span>active stack: {activeStack || ''}</span>
          
          {/* Focused Component */}
          {keyboard.focusedComponent && (
            <>
              <span className="text-border">│</span>
              <span>focus: {keyboard.focusedComponent}</span>
            </>
          )}


          <div className="ml-auto flex items-center gap-3">
            {/* In-flight requests: */}
            <span>{inflightRequests?.length || 0} inflight requests</span>
          </div>
        </>
      )}

    </div>
  )
}
