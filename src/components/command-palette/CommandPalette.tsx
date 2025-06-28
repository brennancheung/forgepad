'use client'

import { useEffect, useState, useCallback, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { KeyboardContext } from '@/lib/keyboard/keyboardProvider'
import { 
  Home, 
  Folder, 
  Settings, 
  FolderPlus, 
  Layers, 
  Database, 
  Search, 
  Trash2, 
  Play, 
  PanelLeft, 
  Moon, 
  Sun,
  Keyboard, 
  BookOpen,
  Code,
  LucideIcon
} from 'lucide-react'

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  home: Home,
  folder: Folder,
  settings: Settings,
  'folder-plus': FolderPlus,
  layers: Layers,
  database: Database,
  search: Search,
  'trash-2': Trash2,
  play: Play,
  'panel-left': PanelLeft,
  moon: Moon,
  sun: Sun,
  keyboard: Keyboard,
  'book-open': BookOpen,
  code: Code,
}

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { getCommands } from '@/lib/commands/commands'
import { filterCommands, groupBy } from '@/lib/commands/filter'
import { CommandShortcut } from './CommandShortcut'
import { useCommandPaletteActions } from './CommandPaletteProvider'
import type { Command as CommandType } from '@/lib/commands/types'

interface CommandPaletteProps {
  workspaceId?: string
  stackId?: string
  features?: {
    sources?: boolean
  }
}

export function CommandPalette({ workspaceId, stackId, features }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()
  const actions = useCommandPaletteActions()
  const keyboardContext = useContext(KeyboardContext)
  
  // Get commands with current context
  const commands = getCommands({ 
    workspaceId, 
    stackId, 
    router,
    features,
    actions,
  })
  
  // Filter commands based on search
  const filteredCommands = filterCommands(commands, search)
  
  // Group by category
  const groupedCommands = groupBy(filteredCommands, 'category')
  
  // Handle command execution
  const executeCommand = useCallback((command: CommandType) => {
    if (command.enabled === false) return
    
    setOpen(false)
    setSearch('')
    
    // Execute after closing to prevent UI glitches
    setTimeout(() => {
      command.action()
    }, 100)
  }, [])
  
  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey
      const isMac = navigator.userAgent.includes('Mac')
      
      // Open command palette
      if (isCmd && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
        return
      }
      
      // Check for command shortcuts
      commands.forEach(command => {
        if (command.shortcut && command.enabled !== false) {
          const shortcut = isMac ? command.shortcut.mac : command.shortcut.windows
          if (!shortcut) return
          
          // Parse shortcut (e.g., "cmd+s" or "ctrl+shift+n")
          const parts = shortcut.toLowerCase().split('+')
          const requiredKey = parts[parts.length - 1]
          const requiresCmd = parts.includes('cmd') || parts.includes('ctrl')
          const requiresShift = parts.includes('shift')
          const requiresAlt = parts.includes('alt')
          
          if (
            e.key.toLowerCase() === requiredKey &&
            isCmd === requiresCmd &&
            e.shiftKey === requiresShift &&
            e.altKey === requiresAlt
          ) {
            e.preventDefault()
            executeCommand(command)
          }
        }
      })
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commands, executeCommand])
  
  // Handle keyboard mode and reset search when opening/closing
  useEffect(() => {
    keyboardContext?.setMode(open ? 'insert' : 'normal')
    if (!open) setSearch('')
  }, [open, keyboardContext])
  
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput 
          placeholder="Search commands..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No commands found.</CommandEmpty>
          
          {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
            <CommandGroup key={category} heading={category}>
              {categoryCommands.map((command) => {
                const Icon = command.icon ? iconMap[command.icon] : null
                
                return (
                  <CommandItem
                    key={command.id}
                    value={command.title}
                    keywords={command.keywords}
                    onSelect={() => executeCommand(command)}
                    disabled={command.enabled === false}
                    className="flex items-center gap-2"
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    <span className="flex-1">{command.title}</span>
                    {command.subtitle && (
                      <span className="text-xs text-muted-foreground">
                        {command.subtitle}
                      </span>
                    )}
                    <CommandShortcut shortcut={command.shortcut} />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  )
}