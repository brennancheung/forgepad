'use client'

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'

export function StackViewDebug2() {
  const renderCount = useRef(0)
  renderCount.current++
  console.log(`[StackViewDebug2] Render #${renderCount.current}`)
  
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Track why we're re-rendering
  const prevInput = useRef(input)
  useEffect(() => {
    if (prevInput.current !== input) {
      console.log(`[StackViewDebug2] Re-render due to input change: "${prevInput.current}" -> "${input}"`)
      prevInput.current = input
    }
  })

  return (
    <div className="flex flex-col gap-4 h-full">
      <Card className="p-4 flex-shrink-0">
        <h2 className="text-lg font-semibold mb-4">Debug View 2 - No Keyboard, No Convex</h2>
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            const start = performance.now()
            console.log(`[StackViewDebug2] onChange start`)
            setInput(e.target.value)
            console.log(`[StackViewDebug2] onChange end - took ${(performance.now() - start).toFixed(2)}ms`)
          }}
          placeholder="Type here to test latency..."
          className="min-h-[100px] resize-none"
        />
        <div className="mt-2 text-sm text-muted-foreground">
          Character count: {input.length}
        </div>
      </Card>
    </div>
  )
}