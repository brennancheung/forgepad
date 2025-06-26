# Command Palette Planning Document

## Overview

A Cmd-K style command palette for Forgepad that provides quick access to all application actions through a searchable, keyboard-driven interface. Simple, functional implementation with static command definitions.

## Core Requirements

### Keyboard Shortcuts
- **Mac**: `Cmd+K` to open palette
- **Windows/Linux**: `Ctrl+K` to open palette
- Escape to close
- Arrow keys for navigation
- Enter to execute
- Tab for autocomplete

## Architecture

### Command Types

```typescript
interface Command {
  id: string
  title: string
  subtitle?: string
  category: string
  icon?: string // Icon name from lucide-react
  keywords: string[]
  shortcut?: {
    mac?: string
    windows?: string
  }
  action: () => void | Promise<void>
  enabled?: boolean
  visible?: boolean
}

interface CommandContext {
  workspaceId?: string
  stackId?: string
  selectedCells?: string[]
  router: NextRouter
}
```

### Command List Definition

```typescript
// /src/lib/commands/commands.ts
export function getCommands(context: CommandContext): Command[] {
  const { workspaceId, stackId, router } = context
  
  return [
    // Navigation
    {
      id: 'go-home',
      title: 'Go to Home',
      category: 'Navigation',
      icon: 'home',
      keywords: ['home', 'dashboard'],
      action: () => router.push('/'),
    },
    {
      id: 'go-workspace',
      title: 'Go to Current Workspace',
      category: 'Navigation',
      icon: 'folder',
      keywords: ['workspace'],
      enabled: !!workspaceId,
      action: () => router.push(`/workspace/${workspaceId}`),
    },
    
    // Create
    {
      id: 'new-workspace',
      title: 'Create New Workspace',
      category: 'Create',
      icon: 'folder-plus',
      keywords: ['new', 'workspace', 'create'],
      shortcut: { mac: 'cmd+shift+n', windows: 'ctrl+shift+n' },
      action: async () => {
        // Open create workspace modal
      },
    },
    {
      id: 'new-stack',
      title: 'Create New Stack',
      category: 'Create',
      icon: 'layers',
      keywords: ['new', 'stack', 'create'],
      enabled: !!workspaceId,
      action: async () => {
        // Create stack in current workspace
      },
    },
    
    // Sources (feature flagged)
    {
      id: 'new-source',
      title: 'Create New Source',
      category: 'Create',
      icon: 'database',
      keywords: ['new', 'source', 'create'],
      visible: features.sources, // Simple feature flag check
      enabled: !!workspaceId,
      action: async () => {
        // Open source creator
      },
    },
    
    // Actions
    {
      id: 'clear-stack',
      title: 'Clear Current Stack',
      category: 'Actions',
      icon: 'trash',
      keywords: ['clear', 'delete', 'empty'],
      enabled: !!stackId,
      action: async () => {
        // Clear stack
      },
    },
    
    // View
    {
      id: 'toggle-sidebar',
      title: 'Toggle Sidebar',
      category: 'View',
      icon: 'sidebar',
      keywords: ['sidebar', 'toggle', 'hide', 'show'],
      shortcut: { mac: 'cmd+/', windows: 'ctrl+/' },
      action: () => {
        // Toggle sidebar
      },
    },
  ].filter(cmd => cmd.visible !== false)
}
```

## Implementation

### Command Palette Component

```typescript
// /src/components/command-palette/CommandPalette.tsx
export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  
  const router = useRouter()
  const { workspaceId, stackId } = useContext(WorkspaceContext)
  
  // Get commands with current context
  const commands = getCommands({ 
    workspaceId, 
    stackId, 
    router 
  })
  
  // Filter commands based on search
  const filteredCommands = filterCommands(commands, search)
  
  // Group by category
  const groupedCommands = groupBy(filteredCommands, 'category')
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey
      
      if (isCmd && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      
      if (open) {
        if (e.key === 'Escape') {
          setOpen(false)
        } else if (e.key === 'Enter') {
          const command = filteredCommands[selectedIndex]
          if (command?.enabled !== false) {
            command.action()
            setOpen(false)
          }
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex(Math.max(0, selectedIndex - 1))
        } else if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex(Math.min(filteredCommands.length - 1, selectedIndex + 1))
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, selectedIndex, filteredCommands])
  
  if (!open) return null
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 max-w-2xl">
        <Command>
          <CommandInput 
            placeholder="Search commands..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No commands found.</CommandEmpty>
            {Object.entries(groupedCommands).map(([category, cmds]) => (
              <CommandGroup key={category} heading={category}>
                {cmds.map((cmd, index) => (
                  <CommandItem
                    key={cmd.id}
                    onSelect={() => {
                      if (cmd.enabled !== false) {
                        cmd.action()
                        setOpen(false)
                      }
                    }}
                    disabled={cmd.enabled === false}
                    className={index === selectedIndex ? 'bg-accent' : ''}
                  >
                    {cmd.icon && <Icon name={cmd.icon} />}
                    <span>{cmd.title}</span>
                    {cmd.subtitle && <span className="text-muted-foreground text-sm">{cmd.subtitle}</span>}
                    {cmd.shortcut && <CommandShortcut shortcut={cmd.shortcut} />}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
```

### Command Filtering

```typescript
// /src/lib/commands/filter.ts
export function filterCommands(commands: Command[], search: string): Command[] {
  if (!search) return commands
  
  const searchLower = search.toLowerCase()
  
  return commands
    .filter(cmd => {
      // Match on title, keywords
      const titleMatch = cmd.title.toLowerCase().includes(searchLower)
      const keywordMatch = cmd.keywords.some(k => k.toLowerCase().includes(searchLower))
      return titleMatch || keywordMatch
    })
    .sort((a, b) => {
      // Prioritize title matches over keyword matches
      const aTitle = a.title.toLowerCase().includes(searchLower)
      const bTitle = b.title.toLowerCase().includes(searchLower)
      if (aTitle && !bTitle) return -1
      if (!aTitle && bTitle) return 1
      return 0
    })
}
```

### Platform Detection

```typescript
// /src/lib/platform.ts
export function getPlatform(): 'mac' | 'windows' | 'linux' {
  if (typeof window === 'undefined') return 'mac'
  
  const platform = window.navigator.platform.toLowerCase()
  if (platform.includes('mac')) return 'mac'
  if (platform.includes('win')) return 'windows'
  return 'linux'
}

export function formatShortcut(shortcut: { mac?: string; windows?: string }): string {
  const platform = getPlatform()
  const key = platform === 'mac' ? shortcut.mac : shortcut.windows
  
  if (!key) return ''
  
  return key
    .replace('cmd', '⌘')
    .replace('ctrl', '⌃')
    .replace('shift', '⇧')
    .replace('alt', '⌥')
    .replace('enter', '⏎')
}
```

## Features

### Search & Filtering
- Simple text search across titles and keywords
- Category grouping
- Disabled state for unavailable commands
- Feature flag filtering

### Keyboard Navigation
- Up/Down arrows to navigate
- Enter to execute
- Escape to close
- Tab completion (future)

### Visual Design
- Modal overlay with backdrop
- Clean, minimal interface
- Category headers
- Icon support
- Keyboard shortcut badges
- Disabled state styling

## Command Examples

### Navigation Commands
```typescript
{
  id: 'go-home',
  title: 'Go to Home',
  category: 'Navigation',
  icon: 'home',
  keywords: ['home', 'dashboard', 'start'],
  action: () => router.push('/')
}

{
  id: 'go-settings',
  title: 'Go to Settings',
  category: 'Navigation', 
  icon: 'settings',
  keywords: ['settings', 'preferences', 'config'],
  shortcut: { mac: 'cmd+,', windows: 'ctrl+,' },
  action: () => router.push('/settings')
}
```

### Create Commands
```typescript
{
  id: 'new-workspace',
  title: 'Create New Workspace',
  category: 'Create',
  icon: 'folder-plus',
  keywords: ['new', 'workspace', 'create', 'add'],
  shortcut: { mac: 'cmd+shift+n', windows: 'ctrl+shift+n' },
  action: async () => {
    // Open workspace creation modal
    setCreateWorkspaceOpen(true)
  }
}

{
  id: 'new-stack',
  title: 'Create New Stack',
  category: 'Create',
  icon: 'layers',
  keywords: ['new', 'stack', 'create', 'add'],
  enabled: !!workspaceId,
  action: async () => {
    const stackId = await createStack({ workspaceId, name: 'New Stack' })
    router.push(`/workspace/${workspaceId}/stack/${stackId}`)
  }
}
```

### Source Commands (Feature Flagged)
```typescript
{
  id: 'new-source',
  title: 'Create New Source',
  category: 'Create',
  icon: 'database',
  keywords: ['new', 'source', 'create', 'add', 'data'],
  visible: features.sources,
  enabled: !!workspaceId,
  action: () => setCreateSourceOpen(true)
}

{
  id: 'search-sources',
  title: 'Search Sources',
  category: 'Search',
  icon: 'search',
  keywords: ['search', 'find', 'sources', 'data'],
  visible: features.sources,
  action: () => setSourceSearchOpen(true)
}
```

## Integration Points

### With Existing Keyboard System
- Command palette respects current keyboard mode
- Doesn't interfere with vim-like navigation
- Global Cmd/Ctrl+K shortcut added to keyboard system

### With Router
- Navigation commands use Next.js router
- Commands can access current route params
- Deep linking preserved

### With Convex State
- Commands can trigger mutations
- Real-time state updates reflected
- Optimistic updates for better UX

## File Structure

```
/src/components/command-palette/
  CommandPalette.tsx      # Main component
  CommandShortcut.tsx     # Shortcut badge component

/src/lib/commands/
  commands.ts             # Command definitions
  filter.ts               # Search/filter logic
  
/src/lib/platform.ts      # Platform detection utilities
```

## Implementation Steps

1. **Create platform detection utilities**
   - Detect Mac/Windows/Linux
   - Format shortcuts appropriately

2. **Build command definitions**
   - Start with basic navigation/create commands
   - Add feature flag support
   - Implement actions

3. **Create CommandPalette component**
   - Use shadcn/ui Command component
   - Add keyboard handling
   - Implement search/filter

4. **Integrate with app**
   - Add to root layout
   - Connect to workspace context
   - Wire up command actions

## Performance Notes

- Commands are defined statically - no dynamic registration overhead
- Simple array filtering for search - fast enough for ~100 commands
- Use React.memo on command items if performance becomes an issue
- Consider virtualization only if we exceed 200+ commands

## Success Metrics

1. Cmd/Ctrl+K opens palette reliably
2. All major app actions are accessible
3. Search finds commands quickly
4. Keyboard navigation feels natural
5. Feature flags hide/show commands correctly
6. Cross-platform shortcuts work as expected