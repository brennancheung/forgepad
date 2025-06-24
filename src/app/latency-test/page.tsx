'use client'

import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'

export default function LatencyTestPage() {
  const [controlled, setControlled] = useState('')
  const [lastKeyTime, setLastKeyTime] = useState<number | null>(null)
  const [keyLatencies, setKeyLatencies] = useState<number[]>([])
  
  const handleControlledChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const now = performance.now()
    if (lastKeyTime) {
      const latency = now - lastKeyTime
      setKeyLatencies(prev => [...prev.slice(-9), latency])
    }
    setLastKeyTime(now)
    setControlled(e.target.value)
  }
  
  const avgLatency = keyLatencies.length > 0 
    ? (keyLatencies.reduce((a, b) => a + b, 0) / keyLatencies.length).toFixed(1)
    : 'N/A'
  
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Textarea Latency Test</h1>
      
      <div className="space-y-8">
        {/* Test 1: Controlled textarea with latency measurement */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Test 1: Controlled Textarea</h2>
          <p className="text-sm text-muted-foreground mb-2">
            Average latency between keystrokes: {avgLatency}ms (last 10 keys)
          </p>
          <Textarea
            value={controlled}
            onChange={handleControlledChange}
            placeholder="Type here to measure latency..."
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Character count: {controlled.length}
          </p>
        </div>
        
        {/* Test 2: Uncontrolled textarea */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Test 2: Uncontrolled Textarea</h2>
          <p className="text-sm text-muted-foreground mb-2">
            This should have minimal latency as React doesn&apos;t re-render on each keystroke
          </p>
          <Textarea
            defaultValue=""
            placeholder="Type here - uncontrolled..."
            className="min-h-[100px]"
          />
        </div>
        
        {/* Test 3: Native textarea */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Test 3: Native HTML Textarea</h2>
          <p className="text-sm text-muted-foreground mb-2">
            Raw HTML textarea with no React or styling overhead
          </p>
          <textarea
            placeholder="Type here - native HTML..."
            className="w-full p-3 border rounded min-h-[100px]"
          />
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-muted rounded">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Type rapidly in each textarea</li>
          <li>Compare the feel of typing responsiveness</li>
          <li>Check the Chrome Performance tab while typing</li>
          <li>Open console to see any error messages</li>
        </ol>
      </div>
    </div>
  )
}