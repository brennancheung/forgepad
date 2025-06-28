import { InternalKeyboardState } from '../keyboardTypes'
import {
  getAffectedPositions,
  deleteItems,
  yankItems,
  pasteItems,
  swapItems,
  rotateItems,
  deleteToPosition,
  yankToPosition
} from '../stackOperations'

describe('Stack Operations', () => {
  const createTestState = (overrides?: Partial<InternalKeyboardState>): InternalKeyboardState => ({
    mode: 'normal',
    commandBuffer: '',
    pendingCount: null,
    activeRegister: '"',
    lastCommand: null,
    stackPosition: 3,
    stackDepth: 10,
    visualSelection: undefined,
    registers: new Map(),
    passthroughRequests: new Set(),
    ...overrides
  })

  describe('getAffectedPositions', () => {
    it('should get positions from current position', () => {
      const state = createTestState({ stackPosition: 5 })
      const positions = getAffectedPositions(state, 3)
      
      expect(positions).toEqual([5, 6, 7])
    })

    it('should respect stack bounds', () => {
      const state = createTestState({ stackPosition: 8, stackDepth: 10 })
      const positions = getAffectedPositions(state, 5)
      
      expect(positions).toEqual([8, 9, 10])
    })

    it('should use visual selection when specified', () => {
      const state = createTestState({
        visualSelection: { start: 3, end: 6 }
      })
      const positions = getAffectedPositions(state, 1, 'from-selection')
      
      expect(positions).toEqual([3, 4, 5, 6])
    })
  })

  describe('deleteItems', () => {
    it('should delete items and adjust stack', () => {
      const state = createTestState({ stackPosition: 5, stackDepth: 10 })
      const result = deleteItems(state, 3)
      
      expect(result.affectedPositions).toEqual([5, 6, 7])
      expect(result.keyboardState.stackDepth).toBe(7)
      expect(result.keyboardState.stackPosition).toBe(5)
      expect(result.operation.type).toBe('delete')
      expect(result.operation.toRegister).toBe('"')
    })

    it('should adjust position when it exceeds new depth', () => {
      const state = createTestState({ stackPosition: 8, stackDepth: 10 })
      const result = deleteItems(state, 5)
      
      expect(result.keyboardState.stackDepth).toBe(7)
      expect(result.keyboardState.stackPosition).toBe(7)
    })

    it('should use custom register', () => {
      const state = createTestState()
      const result = deleteItems(state, 1, 'a')
      
      expect(result.operation.toRegister).toBe('a')
      expect(result.keyboardState.activeRegister).toBe('a')
    })
  })

  describe('yankItems', () => {
    it('should copy items to register', () => {
      const state = createTestState({ stackPosition: 5 })
      const result = yankItems(state, 3)
      
      expect(result.affectedPositions).toEqual([5, 6, 7])
      expect(result.operation.type).toBe('copy')
      expect(result.operation.toRegister).toBe('"')
    })

    it('should clear visual selection', () => {
      const state = createTestState({
        visualSelection: { start: 3, end: 5 }
      })
      const result = yankItems(state, 1)
      
      expect(result.keyboardState.visualSelection).toBeUndefined()
    })
  })

  describe('pasteItems', () => {
    it('should paste after current position', () => {
      const state = createTestState({ stackPosition: 5 })
      const result = pasteItems(state, '"', true)
      
      expect(result.operation.type).toBe('move')
      expect(result.operation.fromRegister).toBe('"')
      expect(result.operation.targetPosition).toBe(5)
    })

    it('should use active register by default', () => {
      const state = createTestState({ activeRegister: 'a' })
      const result = pasteItems(state)
      
      expect(result.operation.fromRegister).toBe('a')
    })
  })

  describe('swapItems', () => {
    it('should swap adjacent items', () => {
      const state = createTestState({ stackPosition: 5 })
      const result = swapItems(state)
      
      expect(result.affectedPositions).toEqual([5, 6])
      expect(result.operation.type).toBe('swap')
    })

    it('should handle edge case at top', () => {
      const state = createTestState({ stackPosition: 10, stackDepth: 10 })
      const result = swapItems(state)
      
      expect(result.affectedPositions).toEqual([10, 9])
    })

    it('should handle insufficient items', () => {
      const state = createTestState({ stackDepth: 1 })
      const result = swapItems(state)
      
      expect(result.affectedPositions).toEqual([])
    })
  })

  describe('rotateItems', () => {
    it('should rotate specified number of items', () => {
      const state = createTestState({ stackPosition: 5 })
      const result = rotateItems(state, 3)
      
      expect(result.affectedPositions).toEqual([5, 6, 7])
      expect(result.operation.type).toBe('rotate')
    })

    it('should handle insufficient items', () => {
      const state = createTestState({ stackPosition: 9, stackDepth: 10 })
      const result = rotateItems(state, 3)
      
      expect(result.affectedPositions).toEqual([9, 10])
    })
  })

  describe('deleteToPosition', () => {
    it('should delete range from current to target', () => {
      const state = createTestState({ stackPosition: 5 })
      const result = deleteToPosition(state, 8)
      
      expect(result.affectedPositions).toEqual([5, 6, 7, 8])
      expect(result.keyboardState.stackDepth).toBe(6)
      expect(result.keyboardState.stackPosition).toBe(5)
    })

    it('should handle reverse range', () => {
      const state = createTestState({ stackPosition: 8 })
      const result = deleteToPosition(state, 5)
      
      expect(result.affectedPositions).toEqual([5, 6, 7, 8])
    })
  })

  describe('yankToPosition', () => {
    it('should yank range from current to target', () => {
      const state = createTestState({ stackPosition: 5 })
      const result = yankToPosition(state, 8, 'a')
      
      expect(result.affectedPositions).toEqual([5, 6, 7, 8])
      expect(result.operation.toRegister).toBe('a')
    })
  })
})