'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useKeyboard } from '@/lib/keyboard'

export function StackViewNoConvex() {
  const renderCount = useRef(0)
  renderCount.current++
  console.log(`[StackViewNoConvex] Render #${renderCount.current}`)
  
  const { setMode } = useKeyboard({
    onKeyboardCommand: (command) => {
      switch (command.type) {
        case 'CANCEL':
          textareaRef.current?.blur()
          break
      }
    }
  })
  
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Stack View (No Convex, With Keyboard)</h2>
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            const start = performance.now()
            console.log(`[StackViewNoConvex] onChange start`)
            setInput(e.target.value)
            console.log(`[StackViewNoConvex] onChange end - took ${(performance.now() - start).toFixed(2)}ms`)
          }}
          placeholder="Enter a prompt..."
          className="min-h-[100px] resize-none"
          onFocus={() => {
            console.log('[StackViewNoConvex] onFocus - switching to insert mode')
            setMode('insert')
          }}
          onBlur={() => {
            console.log('[StackViewNoConvex] onBlur - switching to normal mode')
            setMode('normal')
          }}
        />
        <div className="mt-2 text-sm text-muted-foreground">
          Character count: {input.length}
        </div>
      </Card>
    </div>
  )
}