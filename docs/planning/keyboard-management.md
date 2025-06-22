# Keyboard Management System for Forgepad

## Overview

A custom keyboard management system for Forgepad using functional programming patterns. This design prioritizes core modal editing and command composition without the complexity of macros or undo history.

## Core Requirements

### 1. Modal Behavior (Vim-like)
- **Normal Mode**: Navigation and stack operations
- **Insert Mode**: Text input for prompts/cells
- **Command Mode**: Extended commands (`:w`, `:stack new`, etc.)
- **Visual Mode**: Cell selection and batch operations
- **Search Mode**: Interactive search with live filtering

### 2. Contextual Keymaps
- Keybindings change based on:
  - Current mode
  - Active UI component (stack view, cell editor, sidebar)
  - Cell type (prompt, response, widget)
  - Application state (loading, processing, error)

### 3. Command Composition
- Multi-key sequences with stateful parsing
- Examples:
  - `dd` - delete current cell
  - `3j` - move down 3 cells
  - `yy` - yank (copy) current cell
  - `p` - paste after current position
  - `3yy` - yank 3 cells

### 4. Browser Hotkey Override
- Must intercept and prevent default behavior for:
  - Ctrl/Cmd shortcuts (C, V, X, S, etc.)
  - Alt combinations
  - Function keys
  - Browser navigation (Backspace, Alt+Arrow)

## Use Cases & Features

### Stack Navigation
- `j`/`k` - Move down/up in stack
- `gg`/`G` - Jump to top/bottom
- `5j` - Move down 5 cells
- `Ctrl+u`/`Ctrl+d` - Page up/down
- `/` - Search within stack
- `n`/`N` - Next/previous search result

### Stack Operations
- `o` - Push new cell below
- `O` - Push new cell above
- `dd` - Pop current cell
- `x` - Drop current cell
- `p`/`P` - Paste after/before
- `yy` - Copy cell
- `D` - Delete to bottom of stack

### Cell Operations
- `i` - Enter insert mode (edit cell)
- `a` - Append to cell
- `r` - Replace cell content
- `cc` - Change cell (clear and edit)
- `:name <name>` - Name current cell
- `@name` - Jump to named cell

### Workspace Management
- `gt`/`gT` - Next/previous workspace
- `:ws new` - Create new workspace
- `:ws <name>` - Switch to workspace
- `Ctrl+1-9` - Quick switch to workspace N

### Advanced Features
- **Registers**: Multiple clipboard support
- **Dot repeat**: `.` to repeat last operation

## Core Architecture

### State Model
```typescript
type Mode = 'normal' | 'insert' | 'command' | 'visual';

type KeyboardState = {
  mode: Mode;
  commandBuffer: string;
  pendingCount: number | null;
  activeRegister: string | null;
  lastCommand: string | null;
};

type KeyHandler = (state: KeyboardState, event: KeyboardEvent) => KeyboardState | null;
```

### Command Definition
```typescript
type CommandContext = {
  state: KeyboardState;
  stackState: StackState;
  selection: Selection;
};

type CommandResult = {
  newKeyboardState?: Partial<KeyboardState>;
  action?: () => void;
  preventDefault?: boolean;
};

type Command = (context: CommandContext) => CommandResult;
```

## Technical Challenges

### 1. Event Handling Hierarchy
```
Browser → React → Focus Management → Mode Handler → Command Parser → Action
```

### 2. State Management
- Current mode state
- Command buffer (for multi-key sequences)
- Timeout handling for incomplete commands
- Register storage
- Focus context tracking

### 3. Focus Management
- Input fields need different handling
- Prevent shortcuts when typing in forms
- Handle focus transitions between components

### 4. Performance
- Efficient keymap lookup (trie structure?)
- Debouncing for rapid key sequences
- Memory management for command history

## Functional Design Patterns

### 1. Command Parser
```typescript
const parseCommand = (buffer: string): ParsedCommand | null => {
  const countMatch = buffer.match(/^(\d+)/);
  const count = countMatch ? parseInt(countMatch[1]) : null;
  const remaining = count ? buffer.slice(countMatch[1].length) : buffer;
  
  return {
    count,
    operator: extractOperator(remaining),
    motion: extractMotion(remaining),
    raw: buffer
  };
};
```

### 2. Keymap Resolution
```typescript
type Keymap = {
  [key: string]: Command | Keymap;
};

const resolveKeymap = (
  keymap: Keymap, 
  keys: string
): { command?: Command; partial: boolean } => {
  const parts = keys.split('');
  let current: any = keymap;
  
  for (const key of parts) {
    if (!current[key]) return { partial: false };
    if (typeof current[key] === 'function') {
      return { command: current[key], partial: false };
    }
    current = current[key];
  }
  
  return { partial: true };
};
```

### 3. State Reducer
```typescript
const keyboardReducer = (
  state: KeyboardState,
  event: KeyboardEvent,
  keymaps: Record<Mode, Keymap>
): KeyboardState => {
  const key = formatKey(event);
  
  // Escape always clears the buffer
  if (key === '<Escape>') {
    return {
      ...state,
      commandBuffer: '',
      pendingCount: null,
    };
  }
  
  const newBuffer = state.commandBuffer + key;
  const keymap = keymaps[state.mode];
  
  const { command, partial } = resolveKeymap(keymap, newBuffer);
  
  if (command) {
    // Execute command and reset buffer
    const context = createContext(state);
    const result = command(context);
    
    return {
      ...state,
      ...result.newKeyboardState,
      commandBuffer: '',
      lastCommand: newBuffer,
    };
  }
  
  if (partial) {
    // Continue building the command
    // No timeout - user must complete or escape
    return {
      ...state,
      commandBuffer: newBuffer,
    };
  }
  
  // Not a valid sequence - check if it starts a new command
  const { command: newCommand, partial: newPartial } = resolveKeymap(keymap, key);
  
  if (newCommand || newPartial) {
    // Start new command sequence
    return keyboardReducer({ ...state, commandBuffer: '' }, event, keymaps);
  }
  
  // Invalid key - clear buffer
  return {
    ...state,
    commandBuffer: '',
  };
};
```

## Simplified Keymaps

### Normal Mode Commands
```typescript
const normalModeKeymap: Keymap = {
  // Navigation
  'j': moveCellDown,
  'k': moveCellUp,
  'g': {
    'g': moveToTop,
    't': nextWorkspace,
    'T': previousWorkspace,
  },
  'G': moveToBottom,
  
  // Stack operations
  'o': pushCellBelow,
  'O': pushCellAbove,
  'd': {
    'd': deleteCell,
  },
  'x': dropCell,
  'y': {
    'y': yankCell,
  },
  'p': pasteAfter,
  'P': pasteBefore,
  
  // Mode changes
  'i': enterInsertMode,
  ':': enterCommandMode,
  'v': enterVisualMode,
  '/': enterSearchMode,
  
  // Direct actions
  'u': popStack,
  'r': rotateStack,
  's': swapTop,
};
```

### Key Formatting
```typescript
const formatKey = (event: KeyboardEvent): string => {
  const modifiers = [];
  if (event.ctrlKey || event.metaKey) modifiers.push('C-');
  if (event.altKey) modifiers.push('A-');
  if (event.shiftKey && event.key.length > 1) modifiers.push('S-');
  
  const key = event.key.length === 1 ? event.key : `<${event.key}>`;
  return modifiers.join('') + key;
};
```

## Context-Aware Key Handling

The keyboard manager must intelligently handle different contexts, especially when users are interacting with input fields.

### Context Types
```typescript
type InteractionContext = 
  | 'stack-navigation'    // User navigating the stack
  | 'cell-editing'        // User editing a cell's content
  | 'command-input'       // User typing a : command
  | 'search-input'        // User in search mode
  | 'modal-dialog'        // User in a dialog/modal
  | 'widget-interaction'; // User interacting with interactive widgets

const getInteractionContext = (event: KeyboardEvent): InteractionContext => {
  const target = event.target as HTMLElement;
  
  // Check for specific input types
  if (target.dataset.role === 'command-input') return 'command-input';
  if (target.dataset.role === 'search-input') return 'search-input';
  if (target.dataset.role === 'cell-editor') return 'cell-editing';
  
  // Check for general inputs
  if (isInputElement(target)) {
    const closestCell = target.closest('[data-cell-id]');
    if (closestCell) return 'cell-editing';
  }
  
  // Check for modal/dialog
  if (target.closest('[role="dialog"]')) return 'modal-dialog';
  
  return 'stack-navigation';
};
```

### Key Filtering Strategy
```typescript
type KeyCategory = 
  | 'navigation'      // j, k, gg, G
  | 'editing'         // i, a, o, c
  | 'action'          // d, y, p
  | 'meta'            // Ctrl/Cmd combinations
  | 'escape'          // Esc key
  | 'submit'          // Enter, Ctrl+Enter
  | 'text-input';     // Regular character input

const shouldHandleKey = (
  event: KeyboardEvent,
  context: InteractionContext,
  keyboardState: KeyboardState
): boolean => {
  const category = categorizeKey(event);
  
  switch (context) {
    case 'cell-editing':
      // In cell editing, only handle escape and submit keys
      return category === 'escape' || 
             (category === 'submit' && event.ctrlKey);
    
    case 'command-input':
    case 'search-input':
      // In command/search, handle escape and submit
      return category === 'escape' || category === 'submit';
    
    case 'widget-interaction':
      // In widgets, handle escape and meta keys
      return category === 'escape' || category === 'meta';
    
    case 'modal-dialog':
      // In modals, only handle escape
      return category === 'escape';
    
    case 'stack-navigation':
      // In navigation, handle everything except text input
      // (unless we're building a command like "3j")
      if (keyboardState.commandBuffer && /^\d+$/.test(keyboardState.commandBuffer)) {
        // Allow numbers to continue count prefix
        return true;
      }
      return category !== 'text-input';
    
    default:
      return true;
  }
};
```

### Context-Key Matrix

| Key Type | Stack Navigation | Cell Editing | Command Input | Search Input | Modal Dialog |
|----------|-----------------|--------------|---------------|--------------|--------------|
| `j`, `k` | ✅ Navigate | ❌ Type char | ❌ Type char | ❌ Type char | ❌ Ignored |
| `i`, `a` | ✅ Enter mode | ❌ Type char | ❌ Type char | ❌ Type char | ❌ Ignored |
| `Escape` | ✅ Clear cmd | ✅ Exit edit | ✅ Cancel | ✅ Cancel | ✅ Close |
| `Enter` | ✅ Context | ❌ Newline | ✅ Execute | ✅ Search | ✅ Confirm |
| `Ctrl+Enter` | ✅ Special | ✅ Submit | ✅ Special | ✅ Special | ❌ Ignored |
| `Ctrl+C` | ✅ Copy | ⚠️ Browser | ❌ Browser | ❌ Browser | ❌ Browser |
| `Tab` | ✅ Next stack | ⚠️ Next field | ✅ Complete | ❌ Default | ⚠️ Focus trap |
| `a-z` | ⚠️ Commands | ❌ Type char | ❌ Type char | ❌ Type char | ❌ Ignored |
| `0-9` | ⚠️ Counts | ❌ Type char | ❌ Type char | ❌ Type char | ❌ Ignored |

Legend:
- ✅ Handled by keyboard manager
- ❌ Default browser behavior
- ⚠️ Context-dependent

## Key Design Decisions

### 1. Command Buffer Architecture
```typescript
interface CommandState {
  buffer: string;
  count: number | null;
  register: string | null;
  operator: string | null;
}
```

### 2. Keymap Definition Format
```typescript
type Keymap = {
  [key: string]: KeyAction | KeySequence;
};

type KeyAction = {
  action: (context: ActionContext) => void;
  description: string;
};

type KeySequence = {
  sequence: true;
  timeout?: number;
  keys: Keymap;
};
```

### 3. Context System
```typescript
interface ActionContext {
  editor: EditorState;
  count: number;
  register: string;
  selection: Selection;
  mode: Mode;
}
```

## React Provider Architecture

### Global Keyboard State Provider
```typescript
// Split state for performance
type InternalKeyboardState = {
  mode: Mode;
  commandBuffer: string;
  pendingCount: number | null;
  activeRegister: string | null;
  lastCommand: string | null;
  // Parsing state, temporary buffers, etc.
};

type UIKeyboardState = {
  mode: Mode;
  commandBuffer: string;         // Only for display
  isRecordingCommand: boolean;  // Derived
};

type KeyboardContextValue = {
  // UI state only
  mode: Mode;
  commandBuffer: string;
  isRecordingCommand: boolean;
  interactionContext: InteractionContext;
  
  // Stable methods
  setMode: (mode: Mode) => void;
  executeCommand: (command: string) => void;
};

const KeyboardContext = createContext<KeyboardContextValue | null>(null);

export const useKeyboard = () => {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within KeyboardProvider');
  }
  return context;
};

export const KeyboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // UI state - only what components need to render
  const [uiState, setUiState] = useState<UIKeyboardState>({
    mode: 'normal',
    commandBuffer: '',
    isRecordingCommand: false,
  });

  // Internal state - doesn't trigger re-renders
  const internalStateRef = useRef<InternalKeyboardState>({
    mode: 'normal',
    commandBuffer: '',
    pendingCount: null,
    activeRegister: null,
    lastCommand: null,
  });

  // Focus tracking
  const { focusContext } = useFocusTracking();
  const focusContextRef = useRef(focusContext);
  focusContextRef.current = focusContext;

  // Stable dispatch function using refs
  const dispatchRef = useRef<(action: KeyboardAction) => void>();
  dispatchRef.current = (action: KeyboardAction) => {
    const currentState = internalStateRef.current;
    const newState = keyboardReducer(currentState, action);
    
    // Update internal state
    internalStateRef.current = newState;
    
    // Only update React state if UI-relevant properties changed
    if (
      currentState.mode !== newState.mode ||
      currentState.commandBuffer !== newState.commandBuffer
    ) {
      setUiState({
        mode: newState.mode,
        commandBuffer: newState.commandBuffer,
        isRecordingCommand: newState.commandBuffer.length > 0,
      });
    }
  };

  // Register handler ONCE
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const context = getInteractionContext(event);
      const currentState = internalStateRef.current;
      
      if (!shouldHandleKey(event, context, currentState)) {
        return;
      }
      
      const action = processKeyEvent(event, currentState, context);
      if (action) {
        event.preventDefault();
        dispatchRef.current?.(action);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty deps - only runs once!

  const value = useMemo(() => ({
    // UI state
    mode: uiState.mode,
    commandBuffer: uiState.commandBuffer,
    isRecordingCommand: uiState.isRecordingCommand,
    interactionContext: focusContext,
    
    // Stable methods
    setMode: (mode: Mode) => {
      dispatchRef.current?.({ type: 'SET_MODE', mode });
    },
    executeCommand: (command: string) => {
      dispatchRef.current?.({ type: 'EXECUTE_COMMAND', command });
    },
  }), [uiState, focusContext]);

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
};
```

### Component Usage Examples

#### Status Bar Component
```typescript
export const StatusBar: React.FC = () => {
  const { mode, commandBuffer, pendingCount, interactionContext } = useKeyboard();
  
  const getModeDisplay = () => {
    switch (mode) {
      case 'normal': return 'NORMAL';
      case 'insert': return 'INSERT';
      case 'visual': return 'VISUAL';
      case 'command': return 'COMMAND';
    }
  };
  
  return (
    <div className="status-bar">
      <span className="mode-indicator">{getModeDisplay()}</span>
      {commandBuffer && (
        <span className="command-buffer">
          {pendingCount && <span className="count">{pendingCount}</span>}
          {commandBuffer}
        </span>
      )}
    </div>
  );
};
```

## Implementation Priorities

### Phase 1: Core Modal System
1. Basic mode switching (normal ↔ insert)
2. Single-key navigation (j, k, g, G)
3. Simple stack operations (o, dd, p)
4. Focus management for input fields

### Phase 2: Command Composition
1. Multi-key sequences (dd, yy, gg)
2. Count prefixes (3j, 5dd)
3. Command mode with basic commands
4. Visual mode for selection

### Phase 3: Advanced Features
1. Registers for copy/paste
2. Search within stack
3. Workspace navigation
4. Dot repeat (.) for last command

## Key Design Decisions

### 1. No Classes, Pure Functions
- State transformations via pure functions
- Commands return descriptions of changes
- Side effects isolated to React layer

### 2. Explicit Command Buffer
- Visible feedback for partial commands
- Timeout for incomplete sequences
- Clear command parsing logic

### 3. Simplified State Model
- No undo/redo complexity
- No macro recording
- Focus on essential operations

### 4. Browser Integration
```typescript
const shouldIgnoreKey = (event: KeyboardEvent): boolean => {
  const target = event.target as HTMLElement;
  
  // Allow in our command input
  if (target.dataset.commandInput) return false;
  
  // Ignore in regular inputs
  if (target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' ||
      target.contentEditable === 'true') {
    return true;
  }
  
  return false;
};
```

## Summary

This keyboard manager provides:
- Clean functional architecture without class complexity
- Essential vim-like operations for stack navigation
- Context-aware key handling that respects input fields
- Extensible command system with multi-key sequences
- React-friendly integration with hooks and context

### Key Principles

1. **Context First**: Always determine the interaction context before processing keys
2. **Selective Override**: Only intercept keys that make sense in the current context
3. **User Expectations**: Regular typing should always work in input fields
4. **Escape Hatch**: Escape key should always provide a way out
5. **Progressive Enhancement**: Start simple, add complexity only where needed

### Critical Implementation Notes

- **Input Fields**: When users are typing in inputs, only handle meta keys (Escape, Ctrl+Enter)
- **Focus Tracking**: Maintain awareness of where the user's focus is
- **Browser Defaults**: Respect native browser behavior where it makes sense
- **Mode Indication**: Always show the current mode/context to the user
- **Command Feedback**: Display partial commands as they're being built

### Performance Optimization

The keyboard manager uses a **split-state architecture** to minimize React re-renders:

1. **Internal State (ref)**: Complete keyboard state stored in a ref, updated on every keystroke
2. **UI State (useState)**: Only the subset needed for rendering, updated selectively
3. **Single Event Listener**: Registered once with empty deps array, uses refs to access current state
4. **Selective Updates**: React state only updates when mode or command buffer changes

This approach ensures:
- Zero event listener churn
- Minimal React re-renders
- Sub-millisecond keystroke processing
- Stable performance regardless of typing speed

See `keyboard-manager-performance.md` for detailed analysis.