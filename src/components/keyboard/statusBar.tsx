"use client"

import { useKeyboard } from '@/lib/keyboard'
import { cn } from '@/lib/utils'

export const StatusBar = () => {
  const { mode, commandBuffer, isRecordingCommand, interactionContext } = useKeyboard()
  
  const getModeDisplay = () => {
    switch (mode) {
      case 'normal': 
        return 'NORMAL'
      case 'insert': 
        return 'INSERT'
      case 'visual': 
        return 'VISUAL'
      case 'command': 
        return 'COMMAND'
    }
  }
  
  const getModeColor = () => {
    switch (mode) {
      case 'normal': 
        return 'bg-blue-600'
      case 'insert': 
        return 'bg-green-600'
      case 'visual': 
        return 'bg-orange-600'
      case 'command': 
        return 'bg-purple-600'
    }
  }
  
  const getContextIndicator = () => {
    switch (interactionContext) {
      case 'cell-editing': 
        return '📝'
      case 'search-input': 
        return '🔍'
      case 'command-input': 
        return ':'
      case 'modal-dialog': 
        return '🗨️'
      case 'widget-interaction': 
        return '⚙️'
      default: 
        return null
    }
  }
  
  return (
    <div className="fixed bottom-0 left-0 right-0 h-8 bg-gray-900 text-white flex items-center px-4 text-sm font-mono">
      <div className={cn(
        "px-2 py-0.5 rounded text-xs font-bold",
        getModeColor()
      )}>
        {getModeDisplay()}
      </div>
      
      {getContextIndicator() && (
        <span className="ml-4 text-gray-400">
          {getContextIndicator()}
        </span>
      )}
      
      {isRecordingCommand && (
        <div className="ml-auto flex items-center gap-2">
          <span className="text-gray-500">Command:</span>
          <span className="text-yellow-400">{commandBuffer}</span>
        </div>
      )}
    </div>
  )
}