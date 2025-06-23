# Keyboard Architecture Decisions

## Overview

This document captures the architectural decisions and trade-offs regarding coupling between the keyboard system and stack/computational features in Forgepad.

## Current State (Phases 1-3 Complete)

We have successfully implemented a pure, functional keyboard system with:
- Modal editing (normal, insert, visual, command, search)
- Stack navigation and manipulation
- Search functionality
- Workspace commands
- Dot repeat
- Pure functional architecture with no React dependencies

## The Coupling Question

As we consider Phase 4 (Computational Integration), we face a critical architectural decision: How much should the keyboard system know about the stack and cell types?

### Current Architecture (Loose Coupling)
```
Keyboard Layer: "User pressed '+'"
    ↓ (semantic command)
App Layer: "Execute BINARY_OP '+' on stack"
```

### Proposed Tighter Coupling
```
Keyboard Layer: "User pressed '+' and cells are numbers, so BINARY_OP"
    ↓ (context-aware command)  
App Layer: "Execute this pre-validated operation"
```

## Trade-off Analysis

### Benefits of Coupling
1. **Immediate Feedback**: Validate operations at keystroke time
2. **Mode Intelligence**: RPN mode where '5' pushes vs navigates
3. **Efficiency**: Single-key arithmetic operations
4. **User Experience**: Earlier error detection

### Costs of Coupling
1. **Testing Complexity**: Keyboard tests need mock cell infrastructure
2. **Flexibility Loss**: Different contexts can't redefine operations
3. **Inverted Dependencies**: Low-level knowing about high-level
4. **Reusability**: Can't use keyboard in non-stack contexts
5. **State Synchronization**: Multiple sources of truth

## Architectural Options

### Option 1: Mode Provider Pattern
```typescript
keyboard.setModeProvider({
  shouldUseRPNMode: () => isCurrentCellNumeric(),
  canExecuteOperation: (op) => validateOperation(op)
})
```
- Coupled through interfaces
- Testable with mocks

### Option 2: Keyboard Hints
```typescript
keyboard.updateHints({
  rpnModeActive: true,
  validOperations: ['+', '-', '*', '/']
})
```
- Looser coupling
- Keyboard makes decisions based on hints

### Option 3: Layered Architecture
```
Pure Keyboard Layer → Stack-Aware Layer → App Layer
```
- Middle layer handles coupling
- Keyboard remains pure

### Option 4: Command Enrichment
- Keyboard emits simple commands
- App layer enriches based on context
- Zero coupling

## Recommendation: Pragmatic Middle Ground

### Keep Separate:
- Core keyboard mechanics
- Cell types and values
- Business logic

### Allow Coupling For:
- Mode hints
- Valid operation lists
- Abstract type categories

### Key Principle
**The keyboard should understand contexts and modes, but not their semantics.**

## Decision: Defer

We will defer Phase 4 implementation until:
1. The stack/cell system is more concrete
2. We have real usage patterns to inform design
3. We can make decisions based on actual needs rather than speculation

## Next Steps

When we return to keyboard development:
1. Evaluate actual usage patterns
2. Determine which architectural option best fits
3. Implement with clear boundaries
4. Maintain testability as a core constraint