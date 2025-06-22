// Core types for the keyboard management system

export type Mode = 'normal' | 'insert' | 'command' | 'visual'

export type InteractionContext = 
  | 'stack-navigation'    // User navigating the stack
  | 'cell-editing'        // User editing a cell's content
  | 'command-input'       // User typing a : command
  | 'search-input'        // User in search mode
  | 'modal-dialog'        // User in a dialog/modal
  | 'widget-interaction'  // User interacting with interactive widgets

export type KeyCategory = 
  | 'navigation'      // j, k, gg, G
  | 'editing'         // i, a, o, c
  | 'action'          // d, y, p
  | 'meta'            // Ctrl/Cmd combinations
  | 'escape'          // Esc key
  | 'submit'          // Enter, Ctrl+Enter
  | 'text-input'      // Regular character input

// Internal state - complete keyboard state
export interface InternalKeyboardState {
  mode: Mode
  commandBuffer: string
  pendingCount: number | null
  activeRegister: string | null
  lastCommand: string | null
}

// UI state - only what components need to render
export interface UIKeyboardState {
  mode: Mode
  commandBuffer: string
  isRecordingCommand: boolean
}

// Command context for executing commands
export interface CommandContext {
  state: InternalKeyboardState
  count: number
  register: string
}

// Result of executing a command
export interface CommandResult {
  newKeyboardState?: Partial<InternalKeyboardState>
  action?: () => void
  preventDefault?: boolean
}

// Command function type
export type Command = (context: CommandContext) => CommandResult

// Keymap types
export type Keymap = {
  [key: string]: Command | Keymap
}

// Action types for the reducer
export type KeyboardAction =
  | { type: 'SET_MODE'; mode: Mode }
  | { type: 'EXECUTE_COMMAND'; command: string }
  | { type: 'KEY_DOWN'; key: string; context: InteractionContext }
  | { type: 'CLEAR_BUFFER' }
  | { type: 'SET_REGISTER'; register: string }
  | { type: 'SET_COUNT'; count: number }

// Parsed command structure
export interface ParsedCommand {
  count: number | null
  operator: string | null
  motion: string | null
  raw: string
}

// Context value exposed by the provider
export interface KeyboardContextValue {
  // UI state
  mode: Mode
  commandBuffer: string
  isRecordingCommand: boolean
  interactionContext: InteractionContext
  
  // Stable methods
  setMode: (mode: Mode) => void
  executeCommand: (command: string) => void
}