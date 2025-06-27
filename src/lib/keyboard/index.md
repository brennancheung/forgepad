# Keyboard Management System

## Overview

The keyboard management system implements a vim-like modal editing paradigm for Forgepad.ai. It provides a comprehensive keyboard interface that enables efficient stack navigation and manipulation through keyboard commands.

## Architecture

### Core Concepts

1. **Modal System**: Five distinct modes control how keyboard input is interpreted:
   - `normal`: Default mode for navigation and commands
   - `insert`: Text input mode (only Escape is handled)
   - `visual`: Selection mode for multi-item operations
   - `command`: Ex-command input mode (`:` commands)
   - `search`: Pattern search mode (`/` forward, `?` backward)

2. **Command Buffer Pattern**: Accumulates keystrokes to form complete commands (e.g., `3j`, `dd`, `yy`)

3. **Stack-Based Operations**: Designed specifically for RPN-style stack navigation and manipulation

4. **Pure Functional Core**: All state transformations are pure functions with no side effects

5. **Semantic Commands**: The keyboard layer generates high-level semantic commands that the application layer interprets

### Component Structure

```
keyboard/
├── keyboardProvider.tsx    # Root provider component
├── useKeyboard.tsx        # Primary hook for consuming keyboard functionality
├── keyboardReducer.ts     # Basic keyboard state management
├── stackReducer.ts        # Enhanced reducer with stack-aware parsing
├── keyboardTypes.ts       # TypeScript definitions
├── keyboardCommands.ts    # Command definitions and keymaps
├── keyboardUtils.ts       # Utility functions
└── *Transformations.ts    # Pure functions for state transformations
```

### State Management

The system uses a two-layer state management approach:

1. **Internal State** (comprehensive, kept in refs):
   ```typescript
   {
     mode, commandBuffer, pendingCount, activeRegister,
     lastCommand, stackPosition, stackDepth, visualSelection,
     registers, searchPattern, searchDirection, lastChange
   }
   ```

2. **UI State** (minimal, triggers React updates):
   ```typescript
   {
     mode, commandBuffer, isRecordingCommand,
     stackPosition, stackDepth, visualSelection, searchPattern
   }
   ```

## How to Use the Keyboard System

### Basic Integration

1. **Wrap your app with the KeyboardProvider**:
   ```tsx
   import { KeyboardProvider } from '@/lib/keyboard'

   function App() {
     return (
       <KeyboardProvider>
         {/* Your app components */}
       </KeyboardProvider>
     )
   }
   ```

2. **Access keyboard state in components**:
   ```tsx
   import { useKeyboard } from '@/lib/keyboard'

   function MyComponent() {
     const { mode, setMode } = useKeyboard()
     
     return (
       <div>
         Current mode: {mode}
         <button onClick={() => setMode('insert')}>
           Enter Insert Mode
         </button>
       </div>
     )
   }
   ```

### Advanced Integration with Command Handling

For components that need to respond to keyboard commands:

```tsx
import { useKeyboard } from '@/lib/keyboard'

function StackDisplay() {
  // Helper function to handle keyboard commands
  const handleKeyboardCommand = (command) => {
    const commandHandlers = {
      'MOVE_UP': () => moveStackPosition(-1),
      'MOVE_DOWN': () => moveStackPosition(1),
      'DELETE': () => deleteStackItem(command.range),
      'EDIT': () => startEditing(),
      'STACK_OPERATION': () => executeStackOp(command.operation)
    }

    const handler = commandHandlers[command.type]
    if (handler) handler()
  }

  const { requestFocus, releaseFocus, hasFocus } = useKeyboard({
    focusOnMount: true,
    onKeyboardCommand: handleKeyboardCommand
  })

  return (
    <div onClick={() => requestFocus()}>
      {/* Stack content */}
    </div>
  )
}
```

### Available Commands

#### Navigation Commands
- `j` / `k`: Move down/up
- `g{number}`: Go to specific position
- `gg`: Go to top
- `G`: Go to bottom
- `{number}j` / `{number}k`: Move multiple positions

#### Editing Commands
- `i`: Insert mode
- `o` / `O`: Create new cell below/above
- `c`: Change current cell
- `a`: Append to cell
- `A`: Append at end of cell

#### Stack Operations
- `d`: Delete (with motions: `dd`, `dj`, `dk`)
- `y`: Yank/copy (with motions: `yy`, `yj`, `yk`)
- `p` / `P`: Paste below/above
- `x`: Drop current item
- `s`: Swap top two items
- `R`: Rotate stack
- `u`: Pop from stack

#### Visual Mode
- `v`: Enter visual mode
- `V`: Visual line mode
- `<Esc>`: Exit visual mode

#### Search
- `/`: Forward search
- `?`: Backward search
- `n` / `N`: Next/previous match

### Interaction Contexts

The keyboard system automatically determines context from the DOM:

```tsx
// Add data attributes to provide context
<div data-keyboard-context="cell-editing">
  {/* Keyboard will know this is an editing context */}
</div>

<div data-keyboard-context="modal-dialog">
  {/* Keyboard will know this is a modal */}
</div>
```

Available contexts:
- `stack-navigation`: Default stack operations
- `cell-editing`: Editing cell content
- `command-input`: Typing `:` commands
- `search-input`: Search mode
- `modal-dialog`: Modal is open
- `widget-interaction`: Interacting with widgets

### Focus Management

Components can manage keyboard focus:

```tsx
const { requestFocus, releaseFocus, hasFocus } = useKeyboard()

// Request focus when component needs keyboard input
useEffect(() => {
  if (isActive) return requestFocus()
  releaseFocus()
}, [isActive])
```

### Creating Custom Commands

While the core keyboard system is designed to be stable, you can extend it by:

1. **Handling semantic commands** in your components
2. **Using command composition** to build complex behaviors
3. **Providing appropriate interaction contexts**

Example of handling custom behavior:

```tsx
function CustomWidget() {
  const { mode } = useKeyboard({
    onKeyboardCommand: (command) => {
      if (command.type === 'CUSTOM_ACTION') performCustomAction(command.data)
    }
  })

  return <div>{/* Widget content */}</div>
}
```

## Best Practices

1. **Don't Re-implement Keyboard Handling**: Use the existing system rather than adding key listeners

2. **Use Semantic Commands**: Respond to high-level commands rather than raw keystrokes

3. **Provide Context**: Use `data-keyboard-context` attributes to help the system understand your UI

4. **Manage Focus Appropriately**: Request focus when your component needs keyboard input, release when done

5. **Keep Commands Idempotent**: Commands should be safe to repeat (for the `.` repeat command)

6. **Test with Keyboard**: The system includes comprehensive tests - follow the patterns in `__tests__/`

## Performance Considerations

The keyboard system is optimized for performance:

- Uses refs to avoid unnecessary React re-renders
- Caches DOM traversal results with WeakMap
- Single global event listener instead of per-component
- Memoized callbacks prevent recreation
- Minimal UI state updates

## Debugging

Enable keyboard debugging by checking the console for:
- Mode changes
- Command buffer updates
- Semantic commands dispatched
- Focus changes

The system logs important state changes in development mode.