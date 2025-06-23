import { InternalKeyboardState, Keymap, Command } from './keyboardTypes'
import { parseStackCommand, isPartialStackCommand } from './stackParser'
import { ParsedStackCommand } from './stackTypes'
import { updateSearchPattern, deleteSearchChar, executeSearch, cancelSearch } from './searchTransformations'
import { shouldRecordForRepeat } from './repeatTransformations'

/**
 * Enhanced command resolution that tries stack parsing first
 */
export const resolveStackCommand = (
  buffer: string,
  keymap: Keymap
): { command?: Command; partial: boolean; stackParsed?: ParsedStackCommand } => {
  // First try to parse as a stack command
  const stackCmd = parseStackCommand(buffer)
  
  if (stackCmd) {
    // Map stack commands to their implementations
    const { operator, operand } = stackCmd
    
    // Build a virtual command key for lookup
    let commandKey = operator || ''
    
    // For position commands like "3g", we want to look up "g"
    if (operator === 'g' && operand?.type === 'position') {
      commandKey = 'g'
    }
    // For count commands like "3d", we want to look up "d"
    else if (operand?.type === 'count' && operator?.length === 1) {
      commandKey = operator
    }
    // For special commands like "gg", look up directly
    else if (operator === 'gg' || operator === 'G') {
      commandKey = operator
    }
    
    // Try to find the command in the keymap
    const command = keymap[commandKey] as Command | undefined
    
    if (command && typeof command === 'function') {
      return { command, partial: false, stackParsed: stackCmd }
    }
  }
  
  // Check if it could become a valid stack command
  if (isPartialStackCommand(buffer)) {
    return { partial: true }
  }
  
  // Fall back to traditional keymap resolution
  // This handles non-stack commands like mode changes
  const parts = buffer.split('')
  let current: Keymap | Command = keymap
  
  for (const key of parts) {
    if (typeof current === 'function') return { command: current, partial: false }
    if (typeof current === 'object' && current[key]) {
      current = current[key]
    } else {
      return { partial: false }
    }
  }
  
  if (typeof current === 'function') {
    return { command: current, partial: false }
  }
  
  return { partial: true }
}

/**
 * Create command context with stack-specific information
 */
const createStackContext = (
  state: InternalKeyboardState,
  stackCmd?: ParsedStackCommand
) => {
  // Extract count from the parsed stack command
  let count = 1
  const register = state.activeRegister || '"'
  
  if (stackCmd?.operand) {
    switch (stackCmd.operand.type) {
      case 'count':
        count = stackCmd.operand.value as number
        break
      case 'position':
        // For position commands, the count is the position itself
        count = stackCmd.operand.value as number
        break
    }
  }
  
  return {
    state,
    count,
    register,
    // Add stack-specific context
    stackCommand: stackCmd,
  }
}

/**
 * Process a key event with stack-aware command parsing
 */
export const processKeyWithStack = (
  state: InternalKeyboardState,
  key: string,
  keymap: Keymap
): InternalKeyboardState => {
  // Handle search mode specially
  if (state.mode === 'search') {
    if (key === '<Escape>') {
      return cancelSearch(state)
    } else if (key === '<Enter>') {
      const { state: newState } = executeSearch(state)
      return newState
    } else if (key === '<Backspace>') {
      return deleteSearchChar(state)
    } else if (key.length === 1 && !key.startsWith('<')) {
      // Regular character - add to search pattern
      return updateSearchPattern(state, key)
    }
    // Other special keys in search mode - ignore
    return state
  }
  
  // Handle escape specially
  if (key === '<Escape>') {
    const escapeCmd = keymap['<Escape>'] as Command | undefined
    if (escapeCmd && typeof escapeCmd === 'function') {
      const result = escapeCmd({ state, count: 1, register: '"' })
      return {
        ...state,
        ...(result.newKeyboardState || {}),
        commandBuffer: '',
        lastCommand: key,
        lastCommandTime: Date.now(),
      }
    }
    
    // Default escape behavior
    return {
      ...state,
      commandBuffer: '',
      pendingCount: null,
    }
  }
  
  // Build the command buffer
  const newBuffer = state.commandBuffer + key
  
  // Try to resolve the command
  const { command, partial, stackParsed } = resolveStackCommand(newBuffer, keymap)
  
  if (command) {
    // Execute the command
    const context = createStackContext(state, stackParsed)
    const result = command(context)
    
    // Check if this command should be recorded for repeat
    const shouldRecord = shouldRecordForRepeat(newBuffer)
    const lastChange = shouldRecord ? {
      command: newBuffer,
      count: context.count,
      register: context.register
    } : state.lastChange
    
    return {
      ...state,
      ...(result.newKeyboardState || {}),
      commandBuffer: '',
      lastCommand: newBuffer,
      lastCommandTime: Date.now(),
      lastChange
    }
  }
  
  if (partial) {
    // Continue building the command
    return {
      ...state,
      commandBuffer: newBuffer,
    }
  }
  
  // Not a valid command - try single key
  const { command: singleKey, stackParsed: singleParsed } = resolveStackCommand(key, keymap)
  
  if (singleKey) {
    const context = createStackContext({ ...state, commandBuffer: '' }, singleParsed)
    const result = singleKey(context)
    
    // Check if this command should be recorded for repeat
    const shouldRecord = shouldRecordForRepeat(key)
    const lastChange = shouldRecord ? {
      command: key,
      count: context.count,
      register: context.register
    } : state.lastChange
    
    return {
      ...state,
      ...(result.newKeyboardState || {}),
      commandBuffer: '',
      lastCommand: key,
      lastCommandTime: Date.now(),
      lastChange
    }
  }
  
  // Invalid key - clear buffer
  return {
    ...state,
    commandBuffer: '',
  }
}