import { InternalKeyboardState } from '../keyboardTypes'
import {
  moveToPosition,
  moveRelative,
  startVisualSelection,
  exitVisualSelection,
  getSelectionRange,
  applyStackCommand,
  getAffectedItems,
  validateStackCommand
} from '../stackTransformations'

describe('Stack Transformations', () => {
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
    passthroughRequests: new Set(),
    ...overrides
  })

  describe('moveToPosition', () => {
    it('should move to valid position', () => {
      const state = createTestState()
      const newState = moveToPosition(state, 7)
      
      expect(newState.stackPosition).toBe(7)
      expect(newState.visualSelection).toBeUndefined()
    })

    it('should clamp position to stack bounds', () => {
      const state = createTestState()
      
      expect(moveToPosition(state, 0).stackPosition).toBe(1)
      expect(moveToPosition(state, 15).stackPosition).toBe(10)
    })

    it('should clear visual selection', () => {
      const state = createTestState({
        mode: 'visual',
        visualSelection: { start: 3, end: 5 }
      })
      
      const newState = moveToPosition(state, 7)
      expect(newState.visualSelection).toBeUndefined()
    })
  })

  describe('moveRelative', () => {
    it('should move relative to current position', () => {
      const state = createTestState()
      
      expect(moveRelative(state, 2).stackPosition).toBe(7)
      expect(moveRelative(state, -2).stackPosition).toBe(3)
    })

    it('should extend visual selection in visual mode', () => {
      const state = createTestState({
        mode: 'visual',
        visualSelection: { start: 5, end: 5 }
      })
      
      const newState = moveRelative(state, 2)
      expect(newState.stackPosition).toBe(7)
      expect(newState.visualSelection).toEqual({ start: 5, end: 7 })
    })
  })

  describe('visual selection', () => {
    it('should start visual selection at current position', () => {
      const state = createTestState()
      const newState = startVisualSelection(state)
      
      expect(newState.mode).toBe('visual')
      expect(newState.visualSelection).toEqual({ start: 5, end: 5 })
    })

    it('should exit visual selection and clear selection', () => {
      const state = createTestState({
        mode: 'visual',
        visualSelection: { start: 3, end: 7 }
      })
      
      const newState = exitVisualSelection(state)
      expect(newState.mode).toBe('normal')
      expect(newState.visualSelection).toBeUndefined()
    })
  })

  describe('getSelectionRange', () => {
    it('should return normalized range', () => {
      expect(getSelectionRange({ start: 3, end: 7 })).toEqual([3, 7])
      expect(getSelectionRange({ start: 7, end: 3 })).toEqual([3, 7])
    })

    it('should return null for no selection', () => {
      expect(getSelectionRange(undefined)).toBeNull()
    })
  })

  describe('applyStackCommand', () => {
    it('should handle MOVE_TO_POSITION', () => {
      const state = createTestState()
      const newState = applyStackCommand(state, {
        type: 'MOVE_TO_POSITION',
        position: 8
      })
      
      expect(newState.stackPosition).toBe(8)
    })

    it('should handle POP_ITEMS and adjust position', () => {
      const state = createTestState({ stackPosition: 8 })
      const newState = applyStackCommand(state, {
        type: 'POP_ITEMS',
        count: 3
      })
      
      expect(newState.stackDepth).toBe(7)
      expect(newState.stackPosition).toBe(7) // Clamped to new depth
    })
  })

  describe('getAffectedItems', () => {
    it('should return items for POP_ITEMS from current position', () => {
      const state = createTestState({ stackPosition: 5 })
      const items = getAffectedItems(state, {
        type: 'POP_ITEMS',
        count: 3
      })
      
      expect(items).toEqual([5, 6, 7])
    })

    it('should use visual selection if active', () => {
      const state = createTestState({
        visualSelection: { start: 3, end: 6 }
      })
      const items = getAffectedItems(state, {
        type: 'POP_ITEMS',
        count: 1 // Ignored when selection active
      })
      
      expect(items).toEqual([3, 4, 5, 6])
    })
  })

  describe('validateStackCommand', () => {
    it('should validate position bounds', () => {
      const state = createTestState()
      
      expect(validateStackCommand(state, {
        type: 'MOVE_TO_POSITION',
        position: 5
      })).toEqual({ valid: true })
      
      expect(validateStackCommand(state, {
        type: 'MOVE_TO_POSITION',
        position: 15
      })).toEqual({
        valid: false,
        error: 'Position 15 out of range (1-10)'
      })
    })

    it('should validate pop operations', () => {
      const state = createTestState({ stackDepth: 3, stackPosition: 2 })
      
      expect(validateStackCommand(state, {
        type: 'POP_ITEMS',
        count: 5
      })).toEqual({
        valid: false,
        error: 'Cannot pop 5 items from stack of depth 3'
      })
    })
  })
})