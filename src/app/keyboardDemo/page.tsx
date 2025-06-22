"use client"

import { useState } from 'react'
import { useKeyboard } from '@/lib/keyboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function KeyboardDemoPage() {
  const { mode, setMode } = useKeyboard()
  const [cellContent, setCellContent] = useState('')
  const [commandInput, setCommandInput] = useState('')
  
  return (
    <div className="container mx-auto p-8 pb-16">
      <h1 className="text-3xl font-bold mb-8">Keyboard Manager Demo</h1>
      
      <div className="space-y-8">
        {/* Mode switching buttons */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Manual Mode Switching</h2>
          <div className="flex gap-2">
            <Button 
              onClick={() => setMode('normal')}
              variant={mode === 'normal' ? 'default' : 'outline'}
            >
              Normal Mode
            </Button>
            <Button 
              onClick={() => setMode('insert')}
              variant={mode === 'insert' ? 'default' : 'outline'}
            >
              Insert Mode
            </Button>
            <Button 
              onClick={() => setMode('visual')}
              variant={mode === 'visual' ? 'default' : 'outline'}
            >
              Visual Mode
            </Button>
            <Button 
              onClick={() => setMode('command')}
              variant={mode === 'command' ? 'default' : 'outline'}
            >
              Command Mode
            </Button>
          </div>
        </div>
        
        {/* Different input contexts */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Input Contexts</h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Cell Editor (only Esc and Ctrl+Enter handled)</label>
            <Textarea
              data-role="cell-editor"
              placeholder="Try typing here. Press Esc to exit, Ctrl+Enter to submit"
              value={cellContent}
              onChange={(e) => setCellContent(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Command Input (Esc and Enter handled)</label>
            <Input
              data-role="command-input"
              placeholder="Type a command..."
              value={commandInput}
              onChange={(e) => setCommandInput(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Regular Input (most keys pass through)</label>
            <Input
              placeholder="Regular input - keyboard shortcuts mostly disabled"
            />
          </div>
        </div>
        
        {/* Instructions */}
        <div className="space-y-2 bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold">Keyboard Shortcuts (in Normal mode)</h2>
          <ul className="space-y-1 text-sm">
            <li><code className="px-1 bg-gray-200 dark:bg-gray-700 rounded">j/k</code> - Move down/up (console log)</li>
            <li><code className="px-1 bg-gray-200 dark:bg-gray-700 rounded">gg</code> - Go to top</li>
            <li><code className="px-1 bg-gray-200 dark:bg-gray-700 rounded">G</code> - Go to bottom</li>
            <li><code className="px-1 bg-gray-200 dark:bg-gray-700 rounded">i</code> - Enter insert mode</li>
            <li><code className="px-1 bg-gray-200 dark:bg-gray-700 rounded">v</code> - Enter visual mode</li>
            <li><code className="px-1 bg-gray-200 dark:bg-gray-700 rounded">:</code> - Enter command mode</li>
            <li><code className="px-1 bg-gray-200 dark:bg-gray-700 rounded">dd</code> - Delete (console log)</li>
            <li><code className="px-1 bg-gray-200 dark:bg-gray-700 rounded">yy</code> - Yank/copy (console log)</li>
            <li><code className="px-1 bg-gray-200 dark:bg-gray-700 rounded">3j</code> - Move down 3 times (with count)</li>
            <li><code className="px-1 bg-gray-200 dark:bg-gray-700 rounded">Esc</code> - Clear command buffer / Exit mode</li>
          </ul>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>Open the browser console to see command outputs.</p>
          <p>The status bar at the bottom shows the current mode and command buffer.</p>
        </div>
      </div>
    </div>
  )
}