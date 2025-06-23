"use client"

import { useState } from 'react'
import { useKeyboard } from '@/lib/keyboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function KeyboardDemoPage() {
  const [mode, setMode] = useState('normal')
  const [commandBuffer, setCommandBuffer] = useState('')
  
  const keyboard = useKeyboard({
    onKeyboardCommand: (command) => {
      if (command.type === 'MODE_CHANGE') {
        setMode(command.mode)
      }
      if (command.type === 'COMMAND_BUFFER_UPDATE') {
        setCommandBuffer(command.buffer)
      }
    }
  })
  
  return (
    <div className="container mx-auto p-8 pb-16">
      <h1 className="text-3xl font-bold mb-8">Keyboard Manager Demo</h1>
      
      <div className="space-y-8">
        {/* Current keyboard state */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Keyboard State</h2>
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
            <div className="text-sm space-y-1">
              <div>Mode: <span className="font-bold text-lg">{mode}</span></div>
              {commandBuffer && <div>Command Buffer: <span className="font-mono">{commandBuffer}</span></div>}
            </div>
          </div>
        </div>

        {/* Mode switching buttons */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Manual Mode Switching</h2>
          <div className="flex gap-2">
            <Button 
              onClick={() => keyboard.setMode('normal')}
              variant={mode === 'normal' ? 'default' : 'outline'}
            >
              Normal Mode
            </Button>
            <Button 
              onClick={() => keyboard.setMode('insert')}
              variant={mode === 'insert' ? 'default' : 'outline'}
            >
              Insert Mode
            </Button>
            <Button 
              onClick={() => keyboard.setMode('visual')}
              variant={mode === 'visual' ? 'default' : 'outline'}
            >
              Visual Mode
            </Button>
            <Button 
              onClick={() => keyboard.setMode('command')}
              variant={mode === 'command' ? 'default' : 'outline'}
            >
              Command Mode
            </Button>
          </div>
        </div>

        {/* Test inputs */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Test Inputs</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Regular Input</label>
              <Input 
                placeholder="Test keyboard behavior in input..." 
                className="max-w-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Textarea</label>
              <Textarea 
                placeholder="Test keyboard behavior in textarea..." 
                className="max-w-md"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <div>• Press <kbd>Escape</kbd> to return to Normal mode</div>
            <div>• Press <kbd>i</kbd> to enter Insert mode</div>
            <div>• Press <kbd>v</kbd> to enter Visual mode</div>
            <div>• Press <kbd>:</kbd> to enter Command mode</div>
            <div>• In Normal mode, type commands to see them in the command buffer</div>
          </div>
        </div>
      </div>
    </div>
  )
}