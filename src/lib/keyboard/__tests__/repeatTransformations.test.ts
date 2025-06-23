import { InternalKeyboardState } from '../keyboardTypes'
import {
  recordChange,
  executeDotRepeat,
  shouldRecordForRepeat
} from '../repeatTransformations'

describe('Repeat Transformations', () => {
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

  describe('recordChange', () => {
    it('should record delete command', () => {
      const state = createTestState()
      const newState = recordChange(state, 'd', 1, '"')
      
      expect(newState.lastChange).toEqual({
        command: 'd',
        count: 1,
        register: '"'
      })
    })

    it('should record yank command with count', () => {
      const state = createTestState()
      const newState = recordChange(state, '3y', 3, 'a')
      
      expect(newState.lastChange).toEqual({
        command: '3y',
        count: 3,
        register: 'a'
      })
    })

    it('should not record non-change commands', () => {
      const state = createTestState()
      const newState = recordChange(state, 'j', 1, '"')
      
      expect(newState.lastChange).toBeUndefined()
    })

    it('should not record visual mode entry', () => {
      const state = createTestState()
      const newState = recordChange(state, 'v', 1, '"')
      
      expect(newState.lastChange).toBeUndefined()
    })

    it('should record compound commands', () => {
      const state = createTestState()
      const newState = recordChange(state, 'dd', 1, '"')
      
      expect(newState.lastChange).toEqual({
        command: 'dd',
        count: 1,
        register: '"'
      })
    })
  })

  describe('executeDotRepeat', () => {
    it('should generate dot repeat command when lastChange exists', () => {
      const state = createTestState({
        lastChange: {
          command: '3d',
          count: 3,
          register: '"'
        }
      })
      const { state: newState, command } = executeDotRepeat(state)
      
      expect(newState).toBe(state)
      expect(command).toEqual({
        type: 'DOT_REPEAT'
      })
    })

    it('should not generate command without lastChange', () => {
      const state = createTestState()
      const { state: newState, command } = executeDotRepeat(state)
      
      expect(newState).toBe(state)
      expect(command).toBeUndefined()
    })
  })

  describe('shouldRecordForRepeat', () => {
    it('should record delete commands', () => {
      expect(shouldRecordForRepeat('d')).toBe(true)
      expect(shouldRecordForRepeat('3d')).toBe(true)
      expect(shouldRecordForRepeat('d3g')).toBe(true)
      expect(shouldRecordForRepeat('dd')).toBe(true)
    })

    it('should record yank commands', () => {
      expect(shouldRecordForRepeat('y')).toBe(true)
      expect(shouldRecordForRepeat('5y')).toBe(true)
      expect(shouldRecordForRepeat('y5g')).toBe(true)
      expect(shouldRecordForRepeat('yy')).toBe(true)
    })

    it('should record paste commands', () => {
      expect(shouldRecordForRepeat('p')).toBe(true)
      expect(shouldRecordForRepeat('P')).toBe(true)
      expect(shouldRecordForRepeat('3p')).toBe(true)
    })

    it('should record open commands', () => {
      expect(shouldRecordForRepeat('o')).toBe(true)
      expect(shouldRecordForRepeat('O')).toBe(true)
      expect(shouldRecordForRepeat('5o')).toBe(true)
    })

    it('should record change commands', () => {
      expect(shouldRecordForRepeat('c')).toBe(true)
      expect(shouldRecordForRepeat('cc')).toBe(true)
      expect(shouldRecordForRepeat('3c')).toBe(true)
      expect(shouldRecordForRepeat('c3g')).toBe(true)
    })

    it('should record substitute commands', () => {
      expect(shouldRecordForRepeat('s')).toBe(true)
      expect(shouldRecordForRepeat('S')).toBe(true)
      expect(shouldRecordForRepeat('3s')).toBe(true)
    })

    it('should record rotate commands', () => {
      expect(shouldRecordForRepeat('rr')).toBe(true)
      expect(shouldRecordForRepeat('rs')).toBe(true)
    })

    it('should not record navigation commands', () => {
      expect(shouldRecordForRepeat('j')).toBe(false)
      expect(shouldRecordForRepeat('k')).toBe(false)
      expect(shouldRecordForRepeat('3j')).toBe(false)
      expect(shouldRecordForRepeat('g')).toBe(false)
      expect(shouldRecordForRepeat('G')).toBe(false)
      expect(shouldRecordForRepeat('gg')).toBe(false)
      expect(shouldRecordForRepeat('5g')).toBe(false)
    })

    it('should not record mode changes', () => {
      expect(shouldRecordForRepeat('v')).toBe(false)
      expect(shouldRecordForRepeat('i')).toBe(false)
      expect(shouldRecordForRepeat('a')).toBe(false)
    })

    it('should not record search commands', () => {
      expect(shouldRecordForRepeat('/')).toBe(false)
      expect(shouldRecordForRepeat('?')).toBe(false)
      expect(shouldRecordForRepeat('n')).toBe(false)
      expect(shouldRecordForRepeat('N')).toBe(false)
    })
  })
})