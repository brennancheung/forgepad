'use client'

import { useCallback, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Card } from '@/components/ui/card'
import { StackDisplay } from './StackDisplay'
import { StackPrompt } from './StackPrompt'
import { Id } from '@convex/_generated/dataModel'
import { generateWithAI } from '@/actions/ai'

interface StackViewProps {
  stackId: Id<'stacks'>
  stackName?: string
  cellCount?: number
}

export function StackView({ stackId, stackName, cellCount }: StackViewProps) {
  const createCell = useMutation(api.cells.create)

  // Get cells for conversation history and count
  const cells = useQuery(api.cells.listByStack, { stackId })
  const hasStreamingCell = cells?.some(
    (cell) => cell.status === 'streaming' || cell.status === 'pending'
  )

  // Build conversation history from cells
  const conversationHistory = useMemo(() => {
    if (!cells) return []
    return cells
      .filter(cell => cell.type === 'prompt' || cell.type === 'response')
      .map(cell => ({
        role: cell.type === 'prompt' ? 'user' as const : 'assistant' as const,
        content: cell.content
      }))
  }, [cells])

  const handleSubmit = useCallback(async (promptText: string) => {
    if (!promptText.trim() || hasStreamingCell) return

    try {
      // First, create a cell for the user's prompt
      await createCell({
        stackId,
        content: promptText,
        type: 'prompt',
        status: 'complete',
      })

      // Then generate AI response (don't await so UI isn't blocked)
      generateWithAI({
        prompt: promptText,
        stackId,
        model: 'gpt-4o-mini',
        conversationHistory,
      }).catch((error) => {
        console.error('Generation failed:', error)
      })
    } catch (error) {
      console.error('Generation error:', error)
    }
  }, [hasStreamingCell, createCell, stackId, conversationHistory])

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Stack Display */}
      <Card
        className="flex-1 flex flex-col overflow-hidden min-h-0"
      >
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold">{stackName || 'Stack'}</h2>
          <span className="text-sm text-muted-foreground">
            {cellCount ?? cells?.length ?? 0} cells
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <StackDisplay 
            stackId={stackId} 
            maxHeight="100%" 
          />
        </div>
      </Card>

      {/* Input Area - Now in its own component */}
      <StackPrompt 
        onSubmit={handleSubmit}
        hasStreamingCell={hasStreamingCell}
      />
    </div>
  )
}