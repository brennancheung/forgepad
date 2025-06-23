# Keyboard System Refactoring Plan for Stack-Based Operations

## Overview

This document outlines improvements to the keyboard management system specifically tailored for Forgepad's stack-based paradigm. We adapt vim-like efficiency patterns to operate on cells and computational values rather than text.

## Current Architecture Strengths

1. **Performance Optimized**: Split state architecture (internal vs UI) minimizes re-renders
2. **Context Caching**: DOM traversal optimization for rapid typing
3. **Pure Functions**: State transformations without side effects
4. **TypeScript**: Strong typing throughout the system
5. **Ref-based Event Handling**: Zero event listener churn

## Core Paradigm: Stack Operations vs Text Editing

### Key Differences

| Aspect | Text Editing (Vim) | Stack Operations (Forgepad) |
|--------|-------------------|---------------------------|
| Unit | Characters, words, lines | Cells, values, positions |
| Operations | Delete word, change text | Pop cell, duplicate value |
| Movement | By character/line | By stack position/reference |
| Selection | Text ranges | Stack item ranges |

## Proposed Improvements

### 1. Stack-Aware Command Grammar (High Priority)

**Goal**: Parse commands that understand stack semantics

**Implementation**:
```typescript
interface ParsedStackCommand {
  operator?: string           // d, y, p, etc.
  operand?: StackOperand      // What to operate on
}

interface StackOperand {
  type: 'count' | 'position' | 'range' | 'named' | 'special'
  value?: number | string | [number, number]
  
  // Examples:
  // { type: 'count', value: 3 }        // "3d" - operate on 3 items
  // { type: 'position', value: 3 }     // "3g" - go to position 3
  // { type: 'range', value: [3, 7] }   // "3,7d" - delete positions 3-7
  // { type: 'named', value: 'total' }  // "@total" - named cell
  // { type: 'special', value: 'top' }  // "G" - go to top
}

// Examples:
// 3d      - Delete 3 items
// d3g     - Delete to position 3
// y@name  - Yank named cell
// p3      - Paste at depth 3
```

**Benefits**:
- Natural stack navigation
- Support for named cells
- Position-based operations

### 2. Stack Semantic Command Layer (High Priority)

**Goal**: Translate key sequences into stack operations

**Implementation**:
```typescript
type StackSemanticCommand = 
  // Movement
  | { type: 'MOVE_TO_POSITION', position: number }
  | { type: 'MOVE_RELATIVE', offset: number }
  | { type: 'MOVE_TO_NAMED', name: string }
  
  // Stack manipulation
  | { type: 'POP_ITEMS', count: number, toRegister?: string }
  | { type: 'DUPLICATE_ITEMS', count: number, depth?: number }
  | { type: 'ROTATE_STACK', positions: number[] }
  | { type: 'SWAP_POSITIONS', pos1: number, pos2: number }
  
  // Computational operations
  | { type: 'APPLY_OPERATION', op: Operation, itemCount: number }
  | { type: 'REDUCE_STACK', op: Operation, range: Range }
  
  // Cell operations
  | { type: 'PERSIST_TO_CELL', name?: string, positions: number[] }
  | { type: 'FETCH_FROM_CELL', name: string }
  | { type: 'APPLY_TO_LLM', template: string, references: CellReference[] }
```

**Benefits**:
- Clear separation of parsing from execution
- Enables dot-repeat for stack operations
- Better testing of complex workflows

### 3. Action-Based State Management (Medium Priority)

**Goal**: Add traceability for debugging stack operations

**Implementation**:
```typescript
type KeyboardAction = 
  | { type: 'KEY_PRESSED', key: string, timestamp: number }
  | { type: 'STACK_COMMAND_PARSED', command: ParsedStackCommand }
  | { type: 'STACK_OPERATION', operation: StackSemanticCommand }
  | { type: 'MODE_CHANGED', from: Mode, to: Mode }
  | { type: 'COMPUTATIONAL_MODE_TOGGLED', active: boolean }

// Development logging
const dispatchWithLogging = (action: KeyboardAction) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Keyboard]', action, { 
      stackDepth: getStackDepth(),
      currentPosition: getCurrentPosition() 
    })
  }
  dispatch(action)
}
```

### 4. Type-Aware Command Validation (High Priority)

**Goal**: Ensure operations are valid for item types

**Implementation**:
```typescript
interface StackValidationContext {
  stackDepth: number
  currentPosition: number
  itemTypes: Map<number, ValueType>
  namedCells: Map<string, CellId>
}

const validateStackCommand = (
  command: StackSemanticCommand,
  context: StackValidationContext
): Result<void, ValidationError> => {
  switch (command.type) {
    case 'APPLY_OPERATION':
      // Check if items are numeric for math operations
      // Check if items are strings for concat
      // etc.
  }
}
```

### 5. Enhanced Mode States (Low Priority)

**Implementation**:
```typescript
interface StackModeStates {
  normal: {
    currentPosition: number
    lastOperation?: StackSemanticCommand
    marks: Map<string, number>  // Named positions
  }
  insert: {
    editingCell?: CellId
    templateMode: boolean
  }
  visual: {
    selectionStart: number
    selectionEnd: number
    selectionType: 'items' | 'range'
  }
  computational: {
    active: boolean
    lastExpression?: string
  }
}
```

## Stack-Specific Commands

### Navigation
```
j/k     - Move down/up in stack
3g      - Go to position 3
gg      - Go to bottom (position 1)
G       - Go to top
@name   - Jump to named cell
/text   - Search in cells
```

### Stack Operations
```
d       - Drop (pop without storing)
3d      - Drop 3 items
y       - Yank (copy to register)
p       - Push (paste from register)
x       - Delete (pop to register)
s       - Swap top two
r       - Rotate top three
D       - Drop all above current
```

### Computational Mode
```
+       - Add top two
3+      - Sum top 3
*       - Multiply
:reduce - Reduce with operation
:map    - Map operation over items
```

### Cell Operations
```
:name   - Name current cell
:persist - Save computational value as cell
:fetch  - Load cell to computational stack
:apply  - Use as LLM prompt
```

## Implementation Phases

### Phase 1: Core Stack Navigation (Week 1)
1. Implement position-based movement (3g, gg, G)
2. Add visual selection for stack ranges
3. Create stack-aware command parser
4. Update UI to show position indicators

### Phase 2: Stack Manipulation (Week 2)
1. Implement multi-item operations (3d, 3y)
2. Add register system for stack items
3. Create swap/rotate operations
4. Add type validation

### Phase 3: Computational Integration (Week 3)
1. Add RPN mode detection
2. Implement type-aware operations
3. Create reduce/map commands
4. Add computational shortcuts (3+, etc.)

### Phase 4: Cell System (Week 4)
1. Implement cell naming
2. Add persist/fetch operations
3. Create cell search
4. Add LLM integration commands

## Success Metrics

1. **Efficiency**: Reduce keystrokes for common operations by 50%
2. **Learnability**: New users productive within 10 minutes
3. **Power**: Support 95% of stack operations without mouse
4. **Performance**: All operations complete in <50ms

## Migration Strategy

1. **Backward Compatibility**: Keep existing shortcuts working
2. **Progressive Enhancement**: Add features incrementally
3. **User Testing**: Get feedback on each phase
4. **Documentation**: Update help as features land

## Example Workflows

### Data Analysis
```
10 20 30              # Push numbers
3+                    # Sum all three: [60]
:persist total        # Save as named cell
"Analyze: " @total concat :apply
```

### Multi-Cell Operation
```
v3j                   # Select 3 cells
:persist batch        # Save selection
@batch :apply         # Process with LLM
```

### Stack Manipulation
```
5g                    # Go to position 5
y                     # Yank that item
gg                    # Go to bottom
p                     # Paste
3g2d                  # Go to position 3, delete 2
```

## Future Possibilities

1. **Workspace Operations**: Cross-workspace commands
2. **Macro Recording**: Record stack operation sequences
3. **Custom Commands**: User-defined operations
4. **Type Transformations**: Convert between types
5. **Batch Operations**: Apply commands to multiple cells
6. **History Navigation**: Undo/redo for stack operations