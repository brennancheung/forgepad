'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

// Minimal version of StackView without keyboard system or Convex
export function StackViewMinimal() {
  console.log(`[StackViewMinimal] Component rendering`)
  
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  console.log(`[StackViewMinimal] Current input state: "${input}"`)

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Stack Display */}
      <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold">Stack (Minimal)</h2>
          <span className="text-sm text-muted-foreground">0 cells</span>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <div className="text-muted-foreground">No cells yet</div>
        </div>
      </Card>

      {/* Input Area */}
      <Card className="p-4 flex-shrink-0">
        <form className="space-y-4">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              console.log(`[StackViewMinimal] onChange fired - new value: "${e.target.value}"`)
              setInput(e.target.value)
            }}
            placeholder="Enter a prompt to generate AI response..."
            className="min-h-[100px] resize-none"
          />
          <div className="text-xs text-muted-foreground">
            Character count: {input.length}
          </div>
        </form>
      </Card>
    </div>
  )
}