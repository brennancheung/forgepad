'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Send } from 'lucide-react'
import { useKeyboard } from '@/lib/keyboard'

interface StackPromptProps {
  onSubmit: (prompt: string) => void
  hasStreamingCell?: boolean
}

export function StackPrompt({ onSubmit, hasStreamingCell }: StackPromptProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const { setMode } = useKeyboard({
    onKeyboardCommand: (command) => {
      switch (command.type) {
        case 'CANCEL':
          // Blur the textarea when escape is pressed
          textareaRef.current?.blur()
          break
        case 'EDIT':
          // Focus the textarea when 'i' is pressed
          textareaRef.current?.focus()
          break
      }
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || hasStreamingCell) return
    
    const promptText = input.trim()
    setInput('')
    onSubmit(promptText)
  }

  return (
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
              handleSubmit(e as unknown as React.FormEvent)
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
  )
}