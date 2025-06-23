import { InternalKeyboardState } from './keyboardTypes'
import { StackSemanticCommand } from './stackTypes'
import { getSelectionRange } from './stackTransformations'

/**
 * Stack operation results that describe what should happen
 * but don't actually perform the operations
 */
export interface StackOperationResult {
  // New keyboard state
  keyboardState: Partial<InternalKeyboardState>
  // Items to be operated on
  affectedPositions: number[]
  // What to do with the items
  operation: {
    type: 'delete' | 'copy' | 'move' | 'swap' | 'rotate'
    toRegister?: string
    fromRegister?: string
    targetPosition?: number
  }
}

/**
 * Get positions affected by an operation based on current state
 */
export const getAffectedPositions = (
  state: InternalKeyboardState,
  count: number,
  mode: 'from-current' | 'from-selection' = 'from-current'
): number[] => {
  // If in visual mode with selection, use that
  if (mode === 'from-selection' && state.visualSelection) {
    const [start, end] = getSelectionRange(state.visualSelection) || [1, 1]
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }
  
  // Otherwise, from current position
  const positions: number[] = []
  for (let i = 0; i < count; i++) {
    const pos = state.stackPosition + i
    if (pos <= state.stackDepth) {
      positions.push(pos)
    }
  }
  return positions
}

/**
 * Delete items from stack
 */
export const deleteItems = (
  state: InternalKeyboardState,
  count: number,
  toRegister?: string
): StackOperationResult => {
  const positions = getAffectedPositions(state, count, 'from-selection')
  
  // Calculate new stack depth after deletion
  const newDepth = state.stackDepth - positions.length
  
  // Adjust position if needed
  let newPosition = state.stackPosition
  if (newPosition > newDepth) {
    newPosition = Math.max(1, newDepth)
  }
  
  return {
    keyboardState: {
      stackDepth: newDepth,
      stackPosition: newPosition,
      visualSelection: undefined, // Clear selection after operation
      activeRegister: toRegister || '"',
    },
    affectedPositions: positions,
    operation: {
      type: 'delete',
      toRegister: toRegister || '"',
    }
  }
}

/**
 * Yank (copy) items to register
 */
export const yankItems = (
  state: InternalKeyboardState,
  count: number,
  toRegister?: string
): StackOperationResult => {
  const positions = getAffectedPositions(state, count, 'from-selection')
  
  return {
    keyboardState: {
      visualSelection: undefined, // Clear selection
      activeRegister: toRegister || '"',
    },
    affectedPositions: positions,
    operation: {
      type: 'copy',
      toRegister: toRegister || '"',
    }
  }
}

/**
 * Paste items from register
 */
export const pasteItems = (
  state: InternalKeyboardState,
  fromRegister?: string,
  after: boolean = true
): StackOperationResult => {
  const register = fromRegister || state.activeRegister || '"'
  const targetPosition = state.stackPosition + (after ? 0 : 1)
  
  return {
    keyboardState: {
      // Position will be adjusted by the app after paste
      visualSelection: undefined,
    },
    affectedPositions: [], // No items affected, we're adding
    operation: {
      type: 'move',
      fromRegister: register,
      targetPosition,
    }
  }
}

/**
 * Swap top two items
 */
export const swapItems = (
  state: InternalKeyboardState
): StackOperationResult => {
  if (state.stackDepth < 2) {
    return {
      keyboardState: {},
      affectedPositions: [],
      operation: { type: 'swap' }
    }
  }
  
  const pos1 = state.stackPosition
  const pos2 = pos1 < state.stackDepth ? pos1 + 1 : pos1 - 1
  
  return {
    keyboardState: {},
    affectedPositions: [pos1, pos2],
    operation: { type: 'swap' }
  }
}

/**
 * Rotate top N items
 */
export const rotateItems = (
  state: InternalKeyboardState,
  count: number = 3
): StackOperationResult => {
  const positions = getAffectedPositions(state, count)
  
  if (positions.length < 2) {
    return {
      keyboardState: {},
      affectedPositions: [],
      operation: { type: 'rotate' }
    }
  }
  
  return {
    keyboardState: {},
    affectedPositions: positions,
    operation: { type: 'rotate' }
  }
}

/**
 * Delete to a specific position
 */
export const deleteToPosition = (
  state: InternalKeyboardState,
  targetPosition: number,
  toRegister?: string
): StackOperationResult => {
  const start = Math.min(state.stackPosition, targetPosition)
  const end = Math.max(state.stackPosition, targetPosition)
  
  const positions = Array.from(
    { length: end - start + 1 }, 
    (_, i) => start + i
  )
  
  const newDepth = state.stackDepth - positions.length
  const newPosition = Math.min(start, newDepth)
  
  return {
    keyboardState: {
      stackDepth: newDepth,
      stackPosition: Math.max(1, newPosition),
      activeRegister: toRegister || '"',
    },
    affectedPositions: positions,
    operation: {
      type: 'delete',
      toRegister: toRegister || '"',
    }
  }
}

/**
 * Yank to a specific position
 */
export const yankToPosition = (
  state: InternalKeyboardState,
  targetPosition: number,
  toRegister?: string
): StackOperationResult => {
  const start = Math.min(state.stackPosition, targetPosition)
  const end = Math.max(state.stackPosition, targetPosition)
  
  const positions = Array.from(
    { length: end - start + 1 }, 
    (_, i) => start + i
  )
  
  return {
    keyboardState: {
      activeRegister: toRegister || '"',
    },
    affectedPositions: positions,
    operation: {
      type: 'copy',
      toRegister: toRegister || '"',
    }
  }
}

/**
 * Process a stack manipulation command
 */
export const processStackOperation = (
  state: InternalKeyboardState,
  command: StackSemanticCommand
): StackOperationResult | null => {
  switch (command.type) {
    case 'POP_ITEMS':
      return deleteItems(state, command.count, command.toRegister)
      
    case 'DUPLICATE_ITEMS':
      return yankItems(state, command.count)
      
    case 'PASTE_FROM_REGISTER':
      return pasteItems(state, command.register, true)
      
    case 'SWAP_POSITIONS':
      return swapItems(state)
      
    case 'ROTATE_STACK':
      return rotateItems(state, command.positions.length)
      
    default:
      return null
  }
}