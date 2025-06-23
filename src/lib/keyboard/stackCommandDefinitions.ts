import { Command, CommandResult } from './keyboardTypes'
import { 
  startVisualSelection,
  applyStackCommand 
} from './stackTransformations'
import {
  deleteItems,
  yankItems,
  pasteItems,
  swapItems,
  rotateItems,
  deleteToPosition,
  yankToPosition
} from './stackOperations'
import {
  startSearch,
  navigateMatch
} from './searchTransformations'
import {
  executeDotRepeat
} from './repeatTransformations'
import {
  triggerWorkspaceList
} from './workspaceTransformations'

/**
 * Stack command definitions that return pure state transformations.
 * These commands don't perform side effects - they only describe
 * what state changes should occur.
 */

// Navigation commands
export const stackMoveDown: Command = (context): CommandResult => {
  const count = context.count || 1
  const semanticCmd = { type: 'MOVE_RELATIVE' as const, offset: count }
  const newState = applyStackCommand(context.state, semanticCmd)
  
  return {
    newKeyboardState: {
      stackPosition: newState.stackPosition,
      visualSelection: newState.visualSelection,
    }
  }
}

export const stackMoveUp: Command = (context): CommandResult => {
  const count = context.count || 1
  const semanticCmd = { type: 'MOVE_RELATIVE' as const, offset: -count }
  const newState = applyStackCommand(context.state, semanticCmd)
  
  return {
    newKeyboardState: {
      stackPosition: newState.stackPosition,
      visualSelection: newState.visualSelection,
    }
  }
}

export const stackMoveToPosition: Command = (context): CommandResult => {
  const position = context.count || 1
  const semanticCmd = { type: 'MOVE_TO_POSITION' as const, position }
  const newState = applyStackCommand(context.state, semanticCmd)
  
  return {
    newKeyboardState: {
      stackPosition: newState.stackPosition,
      visualSelection: newState.visualSelection,
    }
  }
}

export const stackMoveToTop: Command = (): CommandResult => {
  // Note: The actual stack depth will be provided by the app
  return {
    newKeyboardState: {
      // This will be handled by the semantic command
    },
    // Return the semantic command for the app to handle
    semanticCommand: { type: 'MOVE_TO_TOP' as const }
  }
}

export const stackMoveToBottom: Command = (): CommandResult => {
  return {
    newKeyboardState: {
      stackPosition: 1,
      visualSelection: undefined,
    }
  }
}

// Visual mode commands
export const stackEnterVisual: Command = (context): CommandResult => {
  const newState = startVisualSelection(context.state)
  
  return {
    newKeyboardState: {
      mode: newState.mode,
      visualSelection: newState.visualSelection,
    }
  }
}

// Stack operations that need app-level handling
export const stackDelete: Command = (context): CommandResult => {
  const count = context.count || 1
  const result = deleteItems(context.state, count, context.register)
  
  return {
    newKeyboardState: result.keyboardState,
    semanticCommand: {
      type: 'DELETE_ITEMS' as const,
      positions: result.affectedPositions,
      toRegister: result.operation.toRegister
    }
  }
}

export const stackYank: Command = (context): CommandResult => {
  const count = context.count || 1
  const result = yankItems(context.state, count, context.register)
  
  return {
    newKeyboardState: result.keyboardState,
    semanticCommand: {
      type: 'YANK_ITEMS' as const,
      positions: result.affectedPositions,
      toRegister: result.operation.toRegister
    }
  }
}

export const stackPaste: Command = (context): CommandResult => {
  const result = pasteItems(context.state, context.register, true)
  
  return {
    newKeyboardState: result.keyboardState,
    semanticCommand: {
      type: 'PASTE_ITEMS' as const,
      fromRegister: result.operation.fromRegister,
      position: result.operation.targetPosition
    }
  }
}

export const stackSwap: Command = (context): CommandResult => {
  const result = swapItems(context.state)
  
  return {
    newKeyboardState: result.keyboardState,
    semanticCommand: {
      type: 'SWAP_ITEMS' as const,
      positions: result.affectedPositions
    }
  }
}

export const stackRotate: Command = (context): CommandResult => {
  const count = context.count || 3
  const result = rotateItems(context.state, count)
  
  return {
    newKeyboardState: result.keyboardState,
    semanticCommand: {
      type: 'ROTATE_ITEMS' as const,
      positions: result.affectedPositions
    }
  }
}

// Delete to position command
export const stackDeleteToPosition: Command = (context): CommandResult => {
  const position = context.count || 1
  const result = deleteToPosition(context.state, position, context.register)
  
  return {
    newKeyboardState: result.keyboardState,
    semanticCommand: {
      type: 'DELETE_TO_POSITION' as const,
      positions: result.affectedPositions,
      toRegister: result.operation.toRegister
    }
  }
}

// Yank to position command
export const stackYankToPosition: Command = (context): CommandResult => {
  const position = context.count || 1
  const result = yankToPosition(context.state, position, context.register)
  
  return {
    newKeyboardState: result.keyboardState,
    semanticCommand: {
      type: 'YANK_TO_POSITION' as const,
      positions: result.affectedPositions,
      toRegister: result.operation.toRegister
    }
  }
}

// Search commands
export const stackStartSearchForward: Command = (context): CommandResult => {
  const newState = startSearch(context.state, 'forward')
  
  return {
    newKeyboardState: {
      mode: newState.mode,
      searchPattern: newState.searchPattern,
      searchDirection: newState.searchDirection,
      commandBuffer: newState.commandBuffer
    }
  }
}

export const stackStartSearchBackward: Command = (context): CommandResult => {
  const newState = startSearch(context.state, 'backward')
  
  return {
    newKeyboardState: {
      mode: newState.mode,
      searchPattern: newState.searchPattern,
      searchDirection: newState.searchDirection,
      commandBuffer: newState.commandBuffer
    }
  }
}

export const stackNextMatch: Command = (context): CommandResult => {
  const { state: newState, command } = navigateMatch(context.state, false)
  
  return {
    newKeyboardState: newState === context.state ? undefined : newState,
    semanticCommand: command
  }
}

export const stackPrevMatch: Command = (context): CommandResult => {
  const { state: newState, command } = navigateMatch(context.state, true)
  
  return {
    newKeyboardState: newState === context.state ? undefined : newState,
    semanticCommand: command
  }
}

// Dot repeat command
export const stackDotRepeat: Command = (context): CommandResult => {
  const { state: newState, command } = executeDotRepeat(context.state)
  
  return {
    newKeyboardState: newState === context.state ? undefined : newState,
    semanticCommand: command
  }
}

// Workspace commands
export const stackListWorkspaces: Command = (context): CommandResult => {
  const { state: newState, command } = triggerWorkspaceList(context.state)
  
  return {
    newKeyboardState: newState === context.state ? undefined : newState,
    semanticCommand: command
  }
}

// Helper to create a command from a parsed stack command
export const createStackCommand = (
  operator: string,
  _operand: unknown
): Command | null => {
  switch (operator) {
    case 'j': return stackMoveDown
    case 'k': return stackMoveUp
    case 'g': return stackMoveToPosition
    case 'G': return stackMoveToTop
    case 'gg': return stackMoveToBottom
    case 'v': return stackEnterVisual
    case 'd': return stackDelete
    case 'x': return stackDelete  // Drop is same as delete
    case 'y': return stackYank
    case 'p': return stackPaste
    case 'P': return stackPaste  // TODO: paste before
    case 's': return stackSwap
    case 'r': return stackRotate
    case 'dg': return stackDeleteToPosition
    case 'yg': return stackYankToPosition
    case 'xg': return stackDeleteToPosition
    case '/': return stackStartSearchForward
    case '?': return stackStartSearchBackward
    case 'n': return stackNextMatch
    case 'N': return stackPrevMatch
    case '.': return stackDotRepeat
    default: return null
  }
}