'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send } from 'lucide-react'
import { StackDisplay } from './StackDisplay'
import { generateWithAI } from '@/actions/ai'
import { Id } from '@convex/_generated/dataModel'
import { useKeyboard } from '@/lib/keyboard'

interface StackViewProps {
  stackId: Id<'stacks'>
  stackName?: string
  cellCount?: number
}

export function StackView({ stackId, stackName, cellCount }: StackViewProps) {
  const { setMode } = useKeyboard({
    onKeyboardCommand: (command) => {
      switch (command.type) {
        case 'CANCEL':
          // Blur the textarea when escape is pressed
          textareaRef.current?.blur()
          break
      }
    }
  })
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const createCell = useMutation(api.cells.create)
  
  const handlePromptFocus = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  // Check if any cells are currently streaming
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || hasStreamingCell) return

    const promptText = input.trim()
    setInput('')

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
  }

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
            onRequestPromptFocus={handlePromptFocus}
          />
        </div>
      </Card>

      {/* Input Area */}
      <Card className="p-4 flex-shrink-0">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
            }}
            placeholder="Enter a prompt to generate AI response..."
            className="min-h-[100px] resize-none"
            onFocus={() => {
              // Auto-switch to insert mode when focusing textarea
              setMode('insert')
            }}
            onBlur={() => {
              // Switch back to normal mode when losing focus
              setMode('normal')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                formRef.current?.requestSubmit()
              }
            }}
          />
          <div className="flex justify-end items-center">
            <Button type="submit" disabled={!input.trim() || hasStreamingCell} className="dark:text-white">
              {hasStreamingCell ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}