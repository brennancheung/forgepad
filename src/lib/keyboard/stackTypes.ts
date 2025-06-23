// Stack-specific types for keyboard commands

export interface StackOperand {
  type: 'count' | 'position' | 'range' | 'named' | 'special'
  value?: number | string | [number, number]
}

export interface ParsedStackCommand {
  operator?: string           // d, y, p, g, etc.
  operand?: StackOperand      // What to operate on
  raw: string                 // Original command string
}

// Stack-specific semantic commands
export type StackSemanticCommand = 
  // Movement
  | { type: 'MOVE_TO_POSITION'; position: number }
  | { type: 'MOVE_RELATIVE'; offset: number }
  | { type: 'MOVE_TO_NAMED'; name: string }
  | { type: 'MOVE_TO_TOP' }
  | { type: 'MOVE_TO_BOTTOM' }
  
  // Stack manipulation
  | { type: 'POP_ITEMS'; count: number; toRegister?: string }
  | { type: 'DUPLICATE_ITEMS'; count: number; depth?: number }
  | { type: 'ROTATE_STACK'; positions: number[] }
  | { type: 'SWAP_POSITIONS'; pos1: number; pos2: number }
  
  // Visual mode
  | { type: 'START_VISUAL_SELECTION'; position: number }
  | { type: 'EXTEND_VISUAL_SELECTION'; to: number }
  | { type: 'EXIT_VISUAL_SELECTION' }
  
  // Cell operations
  | { type: 'PERSIST_TO_CELL'; name?: string; positions: number[] }
  | { type: 'FETCH_FROM_CELL'; name: string }
  | { type: 'NAME_CELL'; position: number; name: string }
  
  // Register operations
  | { type: 'PASTE_FROM_REGISTER'; register: string; position: number }

// Stack state additions
export interface StackState {
  currentPosition: number
  stackDepth: number
  visualSelection?: {
    start: number
    end: number
  }
  namedCells: Map<string, string> // name -> cellId
}

// Validation context for stack commands
export interface StackValidationContext {
  stackDepth: number
  currentPosition: number
  visualSelection?: { start: number; end: number }
  namedCells: Map<string, string>
}

// Validation errors
export type StackValidationError = 
  | { type: 'POSITION_OUT_OF_BOUNDS'; position: number; stackDepth: number }
  | { type: 'NOT_ENOUGH_ITEMS'; required: number; available: number }
  | { type: 'INVALID_RANGE'; start: number; end: number }
  | { type: 'CELL_NOT_FOUND'; name: string }
  | { type: 'INVALID_OPERATION'; reason: string }