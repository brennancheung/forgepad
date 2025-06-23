# Keyboard System Overview

## Current Status

The Forgepad keyboard system is a vim-inspired, stack-aware keyboard interface that has completed Phases 1-3 of development. It provides efficient keyboard-driven interaction with a computational stack.

## Documentation Structure

1. **[Implementation Guide](./planning/keyboard-management.md)** - Core implementation details and patterns
2. **[Refactoring Plan](./planning/keyboard-refactoring-plan.md)** - Full vision and phases
3. **[Architecture Decisions](./planning/keyboard-architecture-decisions.md)** - Coupling and design decisions

## Completed Features

### Phase 1: Core Stack Navigation ✅
- Position-based movement (`3g`, `gg`, `G`)
- Stack navigation (`j`/`k` with counts)
- Visual selection for ranges
- Context-aware key handling

### Phase 2: Stack Manipulation ✅
- Multi-item operations (`3d`, `3y`)
- Register system for copy/paste
- Swap and rotate operations
- Delete/yank to position (`d3g`, `y3g`)

### Phase 3: Advanced Features ✅
- Search mode (`/` forward, `?` backward, `n`/`N` navigation)
- Workspace commands (`:workspace`, `:ws`)
- Dot repeat (`.`) for last change
- Pure functional architecture

## Architecture Highlights

### Pure Functional Core
```typescript
// All state transformations are pure functions
const newState = moveToPosition(state, 5)
const { state: searchState, command } = executeSearch(state)
```

### Semantic Commands
```typescript
// Keyboard generates intentions, not implementations
{ type: 'DELETE_ITEMS', positions: [3, 4, 5], toRegister: '"' }
{ type: 'SEARCH', pattern: 'hello', direction: 'forward' }
```

### Performance Optimizations
- Split state (internal vs UI) to minimize re-renders
- Context caching to avoid DOM traversal
- Ref-based event handling with zero listener churn

## Usage Guide

### Basic Navigation
- `j`/`k` - Move down/up in stack
- `5g` - Go to position 5
- `gg` - Go to bottom (position 1)
- `G` - Go to top of stack

### Stack Operations
- `d` - Delete current item
- `3d` - Delete 3 items
- `y` - Yank (copy) current item
- `p` - Paste after current position
- `.` - Repeat last change

### Search
- `/pattern` - Search forward
- `?pattern` - Search backward
- `n` - Next match
- `N` - Previous match

### Modes
- Normal - Navigation and operations
- Insert - Text input
- Visual - Range selection
- Command - `:` commands
- Search - Pattern input

## Testing

The keyboard system has comprehensive test coverage:
- 86+ unit tests
- Pure functions enable easy testing
- No React dependencies in core logic

Run tests with:
```bash
pnpm test
```

## Future Development

Phase 4 (Computational Integration) is deferred until the stack/cell system is more developed. See [Architecture Decisions](./planning/keyboard-architecture-decisions.md) for details.

## Code Organization

```
src/lib/keyboard/
├── keyboardProvider.tsx      # React integration
├── keyboardTypes.ts          # Type definitions
├── keyboardUtils.ts          # Utilities
├── stackParser.ts            # Command parsing
├── stackTransformations.ts   # State transformations
├── stackOperations.ts        # Operation logic
├── searchTransformations.ts  # Search features
├── repeatTransformations.ts  # Dot repeat
├── workspaceTransformations.ts # Workspace commands
└── __tests__/               # Comprehensive tests
```

## Integration Example

```typescript
// In your React component
import { useKeyboard } from '@/lib/keyboard'

function MyComponent() {
  const keyboard = useKeyboard()
  
  return (
    <div>
      Mode: {keyboard.mode}
      Position: {keyboard.stackPosition}/{keyboard.stackDepth}
    </div>
  )
}
```

## Key Principles

1. **Pure Functions**: No side effects in core logic
2. **Semantic Commands**: Keyboard describes intent, app executes
3. **Testability**: Every feature has comprehensive tests
4. **Performance**: Optimized for rapid key sequences
5. **Extensibility**: Easy to add new commands and modes