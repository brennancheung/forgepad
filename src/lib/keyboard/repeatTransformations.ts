import { InternalKeyboardState } from './keyboardTypes'
import { StackSemanticCommand } from './stackTypes'

/**
 * Record a change command for later repeat
 */
export const recordChange = (
  state: InternalKeyboardState,
  command: string,
  count?: number,
  register?: string
): InternalKeyboardState => {
  // Only record commands that actually change the stack
  const changeCommands = ['d', 'dd', 'y', 'yy', 'p', 'P', 'o', 'O', 'c', 'cc', 's', 'S']
  
  const isChangeCommand = changeCommands.some(cmd => 
    command === cmd || command.endsWith(cmd)
  )
  
  if (!isChangeCommand) return state
  
  return {
    ...state,
    lastChange: {
      command,
      count,
      register
    }
  }
}

/**
 * Execute dot repeat
 */
export const executeDotRepeat = (
  state: InternalKeyboardState
): { state: InternalKeyboardState; command?: StackSemanticCommand } => {
  if (!state.lastChange) {
    return { state }
  }
  
  const command: StackSemanticCommand = {
    type: 'DOT_REPEAT'
  }
  
  return { state, command }
}

/**
 * Check if command should be recorded for repeat
 */
export const shouldRecordForRepeat = (command: string): boolean => {
  // Commands that modify the stack
  const repeatablePatterns = [
    /^[0-9]*d[dg0-9]*$/,  // delete commands
    /^[0-9]*y[yg0-9]*$/,  // yank commands  
    /^[0-9]*p$/,          // paste
    /^[0-9]*P$/,          // paste before
    /^[0-9]*o$/,          // open below
    /^[0-9]*O$/,          // open above
    /^[0-9]*c[cg0-9]*$/,  // change commands
    /^[0-9]*s$/,          // substitute
    /^[0-9]*S$/,          // substitute line
    /^r[rs]$/,            // rotate commands
  ]
  
  return repeatablePatterns.some(pattern => pattern.test(command))
}