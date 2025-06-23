import { InternalKeyboardState } from './keyboardTypes'
import { StackSemanticCommand } from './stackTypes'

/**
 * Start search mode
 */
export const startSearch = (
  state: InternalKeyboardState,
  direction: 'forward' | 'backward' = 'forward'
): InternalKeyboardState => ({
  ...state,
  mode: 'search',
  searchPattern: '',
  searchDirection: direction,
  commandBuffer: ''
})

/**
 * Update search pattern as user types
 */
export const updateSearchPattern = (
  state: InternalKeyboardState,
  char: string
): InternalKeyboardState => {
  if (state.mode !== 'search') return state
  
  return {
    ...state,
    searchPattern: (state.searchPattern || '') + char
  }
}

/**
 * Delete character from search pattern
 */
export const deleteSearchChar = (
  state: InternalKeyboardState
): InternalKeyboardState => {
  if (state.mode !== 'search' || !state.searchPattern) return state
  
  return {
    ...state,
    searchPattern: state.searchPattern.slice(0, -1)
  }
}

/**
 * Execute search and return command
 */
export const executeSearch = (
  state: InternalKeyboardState
): { state: InternalKeyboardState; command?: StackSemanticCommand } => {
  if (state.mode !== 'search' || !state.searchPattern) {
    return { state: { ...state, mode: 'normal' } }
  }
  
  const newState = {
    ...state,
    mode: 'normal' as const
  }
  
  const command: StackSemanticCommand = {
    type: 'SEARCH',
    pattern: state.searchPattern,
    direction: state.searchDirection
  }
  
  return { state: newState, command }
}

/**
 * Cancel search and return to normal mode
 */
export const cancelSearch = (
  state: InternalKeyboardState
): InternalKeyboardState => ({
  ...state,
  mode: 'normal',
  searchPattern: undefined,
  searchDirection: undefined
})

/**
 * Navigate to next/previous match
 */
export const navigateMatch = (
  state: InternalKeyboardState,
  reverse: boolean = false
): { state: InternalKeyboardState; command?: StackSemanticCommand } => {
  if (!state.searchPattern) return { state }
  
  const command: StackSemanticCommand = {
    type: 'NEXT_MATCH',
    reverse
  }
  
  return { state, command }
}