import { Command, CommandContext, CommandResult } from './keyboardTypes'
import { StackSemanticCommand, StackState, StackOperand } from './stackTypes'

// Stack movement commands

export const moveToPosition: Command = (context: CommandContext): CommandResult => {
  // This will be called with the parsed position from the command
  const position = context.count || 1
  
  return {
    action: () => {
      console.log(`Move to stack position ${position}`)
      // TODO: Dispatch stack navigation action
    }
  }
}

export const moveRelative: Command = (context: CommandContext): CommandResult => {
  const offset = context.count || 1
  
  return {
    action: () => {
      console.log(`Move ${offset} positions`)
      // TODO: Dispatch relative movement
    }
  }
}

export const moveToTop: Command = (): CommandResult => ({
  action: () => {
    console.log('Move to top of stack')
    // TODO: Dispatch move to top
  }
})

export const moveToBottom: Command = (): CommandResult => ({
  action: () => {
    console.log('Move to bottom of stack')
    // TODO: Dispatch move to bottom
  }
})

export const moveDown: Command = (context: CommandContext): CommandResult => {
  const count = context.count || 1
  
  return {
    action: () => {
      console.log(`Move down ${count} positions`)
      // TODO: Dispatch move down
    }
  }
}

export const moveUp: Command = (context: CommandContext): CommandResult => {
  const count = context.count || 1
  
  return {
    action: () => {
      console.log(`Move up ${count} positions`)
      // TODO: Dispatch move up
    }
  }
}

// Stack manipulation commands

export const deleteItems: Command = (context: CommandContext): CommandResult => {
  const count = context.count || 1
  
  return {
    action: () => {
      console.log(`Delete ${count} items from stack`)
      // TODO: Dispatch delete items
    }
  }
}

export const yankItems: Command = (context: CommandContext): CommandResult => {
  const count = context.count || 1
  const register = context.register
  
  return {
    action: () => {
      console.log(`Yank ${count} items to register ${register}`)
      // TODO: Dispatch yank items
    }
  }
}

export const pasteItems: Command = (context: CommandContext): CommandResult => {
  const register = context.register
  
  return {
    action: () => {
      console.log(`Paste from register ${register}`)
      // TODO: Dispatch paste items
    }
  }
}

export const swapTop: Command = (): CommandResult => ({
  action: () => {
    console.log('Swap top two stack items')
    // TODO: Dispatch swap
  }
})

export const rotateTop: Command = (): CommandResult => ({
  action: () => {
    console.log('Rotate top three stack items')
    // TODO: Dispatch rotate
  }
})

// Visual mode commands

export const enterVisualMode: Command = (): CommandResult => ({
  newKeyboardState: { mode: 'visual' },
  action: () => {
    console.log('Enter visual mode')
    // TODO: Start visual selection at current position
  }
})

export const extendVisualSelection: Command = (context: CommandContext): CommandResult => {
  const count = context.count || 1
  
  return {
    action: () => {
      console.log(`Extend visual selection by ${count}`)
      // TODO: Extend selection
    }
  }
}

// Helper to convert parsed commands to semantic commands
export const toStackSemanticCommand = (
  operator: string,
  operand: StackOperand,
  _stackState: StackState
): StackSemanticCommand | null => {
  switch (operator) {
    case 'g':
      if (operand.type === 'position') {
        return { type: 'MOVE_TO_POSITION', position: operand.value as number }
      }
      break
      
    case 'gg':
      return { type: 'MOVE_TO_BOTTOM' }
      
    case 'G':
      return { type: 'MOVE_TO_TOP' }
      
    case 'j':
      return { type: 'MOVE_RELATIVE', offset: operand.value as number }
      
    case 'k':
      return { type: 'MOVE_RELATIVE', offset: -(operand.value as number) }
      
    case 'd':
      if (operand.type === 'count') {
        return { type: 'POP_ITEMS', count: operand.value as number }
      }
      break
      
    case 'y':
      if (operand.type === 'count') {
        return { type: 'DUPLICATE_ITEMS', count: operand.value as number }
      }
      break
      
    case '@':
      if (operand.type === 'named') {
        return { type: 'MOVE_TO_NAMED', name: operand.value as string }
      }
      break
      
    case 's':
      return { type: 'SWAP_POSITIONS', pos1: 1, pos2: 2 }
      
    case 'r':
      return { type: 'ROTATE_STACK', positions: [1, 2, 3] }
  }
  
  return null
}