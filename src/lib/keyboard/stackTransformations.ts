import { InternalKeyboardState } from './keyboardTypes'
import { StackSemanticCommand } from './stackTypes'

/**
 * Pure functions that transform keyboard state based on stack operations.
 * These functions have no side effects and are easily testable.
 */

// Helper to clamp position within stack bounds
const clampPosition = (position: number, stackDepth: number): number => {
  return Math.max(1, Math.min(position, stackDepth))
}

// Move to absolute position
export const moveToPosition = (
  state: InternalKeyboardState,
  position: number
): InternalKeyboardState => {
  const newPosition = clampPosition(position, state.stackDepth)
  
  return {
    ...state,
    stackPosition: newPosition,
    visualSelection: undefined, // Clear selection on movement
  }
}

// Move relative to current position
export const moveRelative = (
  state: InternalKeyboardState,
  offset: number
): InternalKeyboardState => {
  const newPosition = clampPosition(state.stackPosition + offset, state.stackDepth)
  
  // If in visual mode, extend selection
  if (state.mode === 'visual' && state.visualSelection) {
    return {
      ...state,
      stackPosition: newPosition,
      visualSelection: {
        ...state.visualSelection,
        end: newPosition,
      },
    }
  }
  
  return {
    ...state,
    stackPosition: newPosition,
    visualSelection: undefined,
  }
}

// Enter visual mode
export const startVisualSelection = (
  state: InternalKeyboardState
): InternalKeyboardState => {
  return {
    ...state,
    mode: 'visual',
    visualSelection: {
      start: state.stackPosition,
      end: state.stackPosition,
    },
  }
}

// Exit visual mode
export const exitVisualSelection = (
  state: InternalKeyboardState
): InternalKeyboardState => {
  return {
    ...state,
    mode: 'normal',
    visualSelection: undefined,
  }
}

// Get the range of selected items (normalized so start <= end)
export const getSelectionRange = (
  selection?: { start: number; end: number }
): [number, number] | null => {
  if (!selection) return null
  return [
    Math.min(selection.start, selection.end),
    Math.max(selection.start, selection.end),
  ]
}

// Apply a semantic command to the state
export const applyStackCommand = (
  state: InternalKeyboardState,
  command: StackSemanticCommand
): InternalKeyboardState => {
  switch (command.type) {
    case 'MOVE_TO_POSITION':
      return moveToPosition(state, command.position)
      
    case 'MOVE_RELATIVE':
      return moveRelative(state, command.offset)
      
    case 'MOVE_TO_TOP':
      return moveToPosition(state, state.stackDepth)
      
    case 'MOVE_TO_BOTTOM':
      return moveToPosition(state, 1)
      
    case 'START_VISUAL_SELECTION':
      return startVisualSelection(state)
      
    case 'EXIT_VISUAL_SELECTION':
      return exitVisualSelection(state)
      
    case 'EXTEND_VISUAL_SELECTION':
      if (state.visualSelection) {
        return {
          ...state,
          visualSelection: {
            ...state.visualSelection,
            end: clampPosition(command.to, state.stackDepth),
          },
        }
      }
      return state
      
    // Stack manipulation commands would be handled by the app,
    // but we can update our position after the operation
    case 'POP_ITEMS':
      // After popping items, position might need adjustment
      const afterPop = Math.max(1, state.stackDepth - command.count)
      return {
        ...state,
        stackDepth: afterPop,
        stackPosition: clampPosition(state.stackPosition, afterPop),
        visualSelection: undefined,
      }
      
    default:
      return state
  }
}

/**
 * Calculate what items are affected by a command
 */
export const getAffectedItems = (
  state: InternalKeyboardState,
  command: StackSemanticCommand
): number[] => {
  switch (command.type) {
    case 'POP_ITEMS': {
      const range = getSelectionRange(state.visualSelection)
      if (range) {
        // In visual mode, operate on selection
        const [start, end] = range
        return Array.from({ length: end - start + 1 }, (_, i) => start + i)
      }
      // Otherwise, pop from current position
      return Array.from({ length: command.count }, (_, i) => state.stackPosition + i)
        .filter(pos => pos <= state.stackDepth)
    }
    
    case 'DUPLICATE_ITEMS': {
      const range = getSelectionRange(state.visualSelection)
      if (range) {
        const [start, end] = range
        return Array.from({ length: end - start + 1 }, (_, i) => start + i)
      }
      return [state.stackPosition]
    }
    
    default:
      return []
  }
}

/**
 * Validate if a command can be executed
 */
export const validateStackCommand = (
  state: InternalKeyboardState,
  command: StackSemanticCommand
): { valid: boolean; error?: string } => {
  switch (command.type) {
    case 'MOVE_TO_POSITION':
      if (command.position < 1 || command.position > state.stackDepth) {
        return { 
          valid: false, 
          error: `Position ${command.position} out of range (1-${state.stackDepth})` 
        }
      }
      return { valid: true }
      
    case 'POP_ITEMS': {
      const affected = getAffectedItems(state, command)
      if (affected.length === 0) {
        return { valid: false, error: 'No items to pop' }
      }
      if (command.count > state.stackDepth) {
        return { valid: false, error: `Cannot pop ${command.count} items from stack of depth ${state.stackDepth}` }
      }
      if (affected.length > state.stackDepth) {
        return { 
          valid: false, 
          error: `Cannot pop ${affected.length} items from stack of ${state.stackDepth}` 
        }
      }
      return { valid: true }
    }
    
    default:
      return { valid: true }
  }
}