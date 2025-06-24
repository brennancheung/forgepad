'use client'

import { useState, useRef, useCallback, Profiler } from 'react'
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

function onRenderCallback(
  id: string, // the "id" prop of the Profiler tree that has just committed
  phase: string, // either "mount" (if the tree just mounted) or "update" (if it re-rendered)
  actualDuration: number, // time spent rendering the committed update
  _baseDuration: number, // estimated time to render the entire subtree without memoization
  _startTime: number, // when React began rendering this update
  _commitTime: number, // when React committed this update
) {
  console.log(`[Profile] ${id} (${phase}) took ${actualDuration.toFixed(2)}ms`)
}

export function StackViewProfile({ stackId, stackName, cellCount }: StackViewProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { setMode } = useKeyboard({
    onKeyboardCommand: (command) => {
      switch (command.type) {
        case 'CANCEL':
          textareaRef.current?.blur()
          break
      }
    }
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || hasStreamingCell) return

    const promptText = input.trim()
    setInput('')

    try {
      await createCell({
        stackId,
        content: promptText,
        type: 'prompt',
        status: 'complete',
      })

      generateWithAI({
        prompt: promptText,
        stackId,
        model: 'gpt-4o-mini',
      }).catch((error) => {
        console.error('Generation failed:', error)
      })
    } catch (error) {
      console.error('Generation error:', error)
    }
  }

  return (
    <Profiler id="StackViewProfile" onRender={onRenderCallback}>
      <div className="flex flex-col gap-4 h-full">
        <Profiler id="StackDisplay-Section" onRender={onRenderCallback}>
          <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
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
        </Profiler>

        <Profiler id="Input-Section" onRender={onRenderCallback}>
          <Card className="p-4 flex-shrink-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                }}
                placeholder="Enter a prompt to generate AI response..."
                className="min-h-[100px] resize-none"
                onFocus={() => {
                  setMode('insert')
                }}
                onBlur={() => {
                  setMode('normal')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                  }
                }}
              />
              <div className="flex justify-end items-center">
                <Button type="submit" disabled={!input.trim() || hasStreamingCell}>
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
        </Profiler>
      </div>
    </Profiler>
  )
}