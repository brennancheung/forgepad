import { InternalKeyboardState } from '../keyboardTypes'
import {
  startSearch,
  updateSearchPattern,
  deleteSearchChar,
  executeSearch,
  cancelSearch,
  navigateMatch
} from '../searchTransformations'

describe('Search Transformations', () => {
  const createTestState = (overrides?: Partial<InternalKeyboardState>): InternalKeyboardState => ({
    mode: 'normal',
    commandBuffer: '',
    pendingCount: null,
    activeRegister: null,
    lastCommand: null,
    stackPosition: 5,
    stackDepth: 10,
    visualSelection: undefined,
    registers: new Map(),
    ...overrides
  })

  describe('startSearch', () => {
    it('should enter search mode with forward direction', () => {
      const state = createTestState()
      const newState = startSearch(state, 'forward')
      
      expect(newState.mode).toBe('search')
      expect(newState.searchPattern).toBe('')
      expect(newState.searchDirection).toBe('forward')
      expect(newState.commandBuffer).toBe('')
    })

    it('should enter search mode with backward direction', () => {
      const state = createTestState()
      const newState = startSearch(state, 'backward')
      
      expect(newState.mode).toBe('search')
      expect(newState.searchDirection).toBe('backward')
    })

    it('should default to forward direction', () => {
      const state = createTestState()
      const newState = startSearch(state)
      
      expect(newState.searchDirection).toBe('forward')
    })
  })

  describe('updateSearchPattern', () => {
    it('should add character to search pattern', () => {
      const state = createTestState({
        mode: 'search',
        searchPattern: 'hel'
      })
      const newState = updateSearchPattern(state, 'l')
      
      expect(newState.searchPattern).toBe('hell')
    })

    it('should handle first character', () => {
      const state = createTestState({
        mode: 'search',
        searchPattern: ''
      })
      const newState = updateSearchPattern(state, 'h')
      
      expect(newState.searchPattern).toBe('h')
    })

    it('should not update if not in search mode', () => {
      const state = createTestState({
        mode: 'normal',
        searchPattern: 'test'
      })
      const newState = updateSearchPattern(state, 'x')
      
      expect(newState).toBe(state)
    })
  })

  describe('deleteSearchChar', () => {
    it('should delete last character from search pattern', () => {
      const state = createTestState({
        mode: 'search',
        searchPattern: 'hello'
      })
      const newState = deleteSearchChar(state)
      
      expect(newState.searchPattern).toBe('hell')
    })

    it('should handle empty pattern', () => {
      const state = createTestState({
        mode: 'search',
        searchPattern: ''
      })
      const newState = deleteSearchChar(state)
      
      expect(newState).toBe(state)
    })

    it('should not delete if not in search mode', () => {
      const state = createTestState({
        mode: 'normal',
        searchPattern: 'test'
      })
      const newState = deleteSearchChar(state)
      
      expect(newState).toBe(state)
    })
  })

  describe('executeSearch', () => {
    it('should execute search and return to normal mode', () => {
      const state = createTestState({
        mode: 'search',
        searchPattern: 'hello',
        searchDirection: 'forward'
      })
      const { state: newState, command } = executeSearch(state)
      
      expect(newState.mode).toBe('normal')
      expect(command).toEqual({
        type: 'SEARCH',
        pattern: 'hello',
        direction: 'forward'
      })
    })

    it('should cancel search if pattern is empty', () => {
      const state = createTestState({
        mode: 'search',
        searchPattern: ''
      })
      const { state: newState, command } = executeSearch(state)
      
      expect(newState.mode).toBe('normal')
      expect(command).toBeUndefined()
    })

    it('should not execute if not in search mode', () => {
      const state = createTestState({
        mode: 'normal',
        searchPattern: 'hello'
      })
      const { state: newState, command } = executeSearch(state)
      
      expect(newState.mode).toBe('normal')
      expect(command).toBeUndefined()
    })
  })

  describe('cancelSearch', () => {
    it('should exit search mode and clear pattern', () => {
      const state = createTestState({
        mode: 'search',
        searchPattern: 'hello',
        searchDirection: 'forward'
      })
      const newState = cancelSearch(state)
      
      expect(newState.mode).toBe('normal')
      expect(newState.searchPattern).toBeUndefined()
      expect(newState.searchDirection).toBeUndefined()
    })
  })

  describe('navigateMatch', () => {
    it('should generate next match command', () => {
      const state = createTestState({
        searchPattern: 'hello'
      })
      const { state: newState, command } = navigateMatch(state, false)
      
      expect(newState).toBe(state) // State unchanged
      expect(command).toEqual({
        type: 'NEXT_MATCH',
        reverse: false
      })
    })

    it('should generate previous match command', () => {
      const state = createTestState({
        searchPattern: 'hello'
      })
      const { command } = navigateMatch(state, true)
      
      expect(command).toEqual({
        type: 'NEXT_MATCH',
        reverse: true
      })
    })

    it('should not navigate without search pattern', () => {
      const state = createTestState()
      const { state: newState, command } = navigateMatch(state)
      
      expect(newState).toBe(state)
      expect(command).toBeUndefined()
    })
  })
})