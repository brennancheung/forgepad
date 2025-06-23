import { InternalKeyboardState } from './keyboardTypes'
import { StackSemanticCommand } from './stackTypes'

/**
 * Parse workspace command from command mode buffer
 */
export const parseWorkspaceCommand = (
  buffer: string
): StackSemanticCommand | null => {
  // :workspace <name> or :w <name>
  const switchMatch = buffer.match(/^:(workspace|w)\s+(\S+)$/)
  if (switchMatch) {
    return { type: 'SWITCH_WORKSPACE', name: switchMatch[2] }
  }
  
  // :workspaces or :ws
  const listMatch = buffer.match(/^:(workspaces|ws)$/)
  if (listMatch) {
    return { type: 'LIST_WORKSPACES' }
  }
  
  // :new-workspace <name> or :nw <name>
  const createMatch = buffer.match(/^:(new-workspace|nw)\s+(\S+)$/)
  if (createMatch) {
    return { type: 'CREATE_WORKSPACE', name: createMatch[2] }
  }
  
  return null
}

/**
 * Create workspace command
 */
export const createWorkspaceCommand = (
  state: InternalKeyboardState,
  name: string
): { state: InternalKeyboardState; command: StackSemanticCommand } => {
  const command: StackSemanticCommand = {
    type: 'SWITCH_WORKSPACE',
    name
  }
  
  return { state, command }
}

/**
 * Quick workspace switch (e.g., <leader>w)
 */
export const triggerWorkspaceList = (
  state: InternalKeyboardState
): { state: InternalKeyboardState; command: StackSemanticCommand } => {
  const command: StackSemanticCommand = {
    type: 'LIST_WORKSPACES'
  }
  
  return { state, command }
}