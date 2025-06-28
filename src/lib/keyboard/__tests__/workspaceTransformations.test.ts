import { InternalKeyboardState } from '../keyboardTypes'
import {
  parseWorkspaceCommand,
  createWorkspaceCommand,
  triggerWorkspaceList
} from '../workspaceTransformations'

describe('Workspace Transformations', () => {
  const createTestState = (): InternalKeyboardState => ({
    mode: 'normal',
    commandBuffer: '',
    pendingCount: null,
    activeRegister: null,
    lastCommand: null,
    stackPosition: 5,
    stackDepth: 10,
    visualSelection: undefined,
    registers: new Map(),
    passthroughRequests: new Set()
  })

  describe('parseWorkspaceCommand', () => {
    it('should parse workspace switch command', () => {
      expect(parseWorkspaceCommand(':workspace finance')).toEqual({
        type: 'SWITCH_WORKSPACE',
        name: 'finance'
      })
      
      expect(parseWorkspaceCommand(':w finance')).toEqual({
        type: 'SWITCH_WORKSPACE',
        name: 'finance'
      })
    })

    it('should parse workspace list command', () => {
      expect(parseWorkspaceCommand(':workspaces')).toEqual({
        type: 'LIST_WORKSPACES'
      })
      
      expect(parseWorkspaceCommand(':ws')).toEqual({
        type: 'LIST_WORKSPACES'
      })
    })

    it('should parse new workspace command', () => {
      expect(parseWorkspaceCommand(':new-workspace project-x')).toEqual({
        type: 'CREATE_WORKSPACE',
        name: 'project-x'
      })
      
      expect(parseWorkspaceCommand(':nw project-x')).toEqual({
        type: 'CREATE_WORKSPACE',
        name: 'project-x'
      })
    })

    it('should return null for invalid commands', () => {
      expect(parseWorkspaceCommand(':invalid')).toBeNull()
      expect(parseWorkspaceCommand('workspace')).toBeNull()
      expect(parseWorkspaceCommand(':w')).toBeNull() // Missing name
    })

    it('should handle workspace names with special characters', () => {
      expect(parseWorkspaceCommand(':w my-workspace_123')).toEqual({
        type: 'SWITCH_WORKSPACE',
        name: 'my-workspace_123'
      })
    })
  })

  describe('createWorkspaceCommand', () => {
    it('should create workspace switch command', () => {
      const state = createTestState()
      const { state: newState, command } = createWorkspaceCommand(state, 'finance')
      
      expect(newState).toBe(state) // State unchanged
      expect(command).toEqual({
        type: 'SWITCH_WORKSPACE',
        name: 'finance'
      })
    })
  })

  describe('triggerWorkspaceList', () => {
    it('should create list workspaces command', () => {
      const state = createTestState()
      const { state: newState, command } = triggerWorkspaceList(state)
      
      expect(newState).toBe(state) // State unchanged
      expect(command).toEqual({
        type: 'LIST_WORKSPACES'
      })
    })
  })
})