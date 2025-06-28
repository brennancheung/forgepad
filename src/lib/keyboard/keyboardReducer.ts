import { InternalKeyboardState, KeyboardAction, Keymap, CommandContext, Command } from './keyboardTypes'
import { parseCommand } from './keyboardUtils'

const initialState: InternalKeyboardState = {
  mode: 'normal',
  commandBuffer: '',
  pendingCount: null,
  activeRegister: null,
  lastCommand: null,
  // Stack state
  stackPosition: 1,
  stackDepth: 0,
  visualSelection: undefined,
  // Register system
  registers: new Map(),
  // Passthrough system
  passthroughRequests: new Set(),
}

// Resolve a key sequence in the keymap
export const resolveKeymap = (
  keymap: Keymap,
  keys: string
): { command?: Command; partial: boolean } => {
  const parts = keys.split('');
  let current: Keymap | Command = keymap;
  
  for (const key of parts) {
    if (typeof current === 'function') return { command: current, partial: false }
    if (typeof current === 'object' && current[key]) {
      current = current[key];
    } else {
      return { partial: false }
    }
  }
  
  if (typeof current === 'function') {
    return { command: current, partial: false }
  }
  
  return { partial: true }
}

// Create command context from state
const createContext = (state: InternalKeyboardState): CommandContext => {
  const parsed = parseCommand(state.commandBuffer);
  return {
    state,
    count: parsed?.count || 1,
    register: state.activeRegister || '"', // Default register
  }
}

// Process a key event with the current keymap
export const processKeyWithKeymap = (
  state: InternalKeyboardState,
  key: string,
  keymap: Keymap
): InternalKeyboardState => {
  // For single-key commands (including Escape), try to resolve directly first
  const { command: singleKeyCommand } = resolveKeymap(keymap, key);
  if (singleKeyCommand) {
    const context = createContext(state);
    const result = singleKeyCommand(context);
    
    return {
      ...state,
      ...(result.newKeyboardState || {}),
      commandBuffer: '',
      lastCommand: key,
      lastCommandTime: Date.now(),
    }
  }
  
  // If Escape wasn't found in keymap, just clear the buffer
  if (key === '<Escape>') {
    return {
      ...state,
      commandBuffer: '',
      pendingCount: null,
    }
  }
  
  const newBuffer = state.commandBuffer + key;
  const { command, partial } = resolveKeymap(keymap, newBuffer);
  
  if (command) {
    // Execute command and reset buffer
    const context = createContext(state);
    const result = command(context);
    
    return {
      ...state,
      ...(result.newKeyboardState || {}),
      commandBuffer: '',
      lastCommand: newBuffer,
      // Add a timestamp to ensure repeated commands are detected
      lastCommandTime: Date.now(),
    }
  }
  
  if (partial) {
    // Continue building the command
    return {
      ...state,
      commandBuffer: newBuffer,
    }
  }
  
  // Not a valid sequence - check if it starts a new command
  const { command: newCommand, partial: newPartial } = resolveKeymap(keymap, key);
  
  if (newCommand || newPartial) {
    // Start new command sequence
    return processKeyWithKeymap({ ...state, commandBuffer: '' }, key, keymap);
  }
  
  // Invalid key - clear buffer
  return {
    ...state,
    commandBuffer: '',
  }
}

// Main keyboard reducer
export const keyboardReducer = (
  state: InternalKeyboardState = initialState,
  action: KeyboardAction
): InternalKeyboardState => {
  switch (action.type) {
    case 'SET_MODE':
      return {
        ...state,
        mode: action.mode,
        commandBuffer: '', // Clear buffer on mode change
      }
    
    case 'CLEAR_BUFFER':
      return {
        ...state,
        commandBuffer: '',
        pendingCount: null,
      }
    
    case 'SET_REGISTER':
      return {
        ...state,
        activeRegister: action.register,
      }
    
    case 'SET_COUNT':
      return {
        ...state,
        pendingCount: action.count,
      }
    
    case 'EXECUTE_COMMAND':
      // This would be handled by command mode parsing
      // For now, just return state
      return state;
    
    case 'KEY_DOWN':
      // This is handled by processKeyWithKeymap
      // The provider will call this with the appropriate keymap
      return state;
    
    default:
      return state;
  }
}

export { initialState }