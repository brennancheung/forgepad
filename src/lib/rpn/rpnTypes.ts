/**
 * Core types for the RPN calculator system
 * Forward-compatible with full Forth-like semantics
 */

import { Id } from '@convex/_generated/dataModel'

// Base value types that can exist on the computational stack
export type StackValueType = 'number' | 'string' | 'array' | 'boolean' | 'cell'

// Stack values - lightweight, in-memory values
export interface StackValue {
  type: StackValueType
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
  ephemeral: boolean // true = not persisted to database
}

// Specific typed stack values for type safety
export interface NumberValue extends StackValue {
  type: 'number'
  value: number
}

export interface StringValue extends StackValue {
  type: 'string'
  value: string
}

export interface ArrayValue extends StackValue {
  type: 'array'
  value: StackValue[]
}

export interface BooleanValue extends StackValue {
  type: 'boolean'
  value: boolean
}

export interface CellValue extends StackValue {
  type: 'cell'
  value: Id<'cells'> | string // ID or name reference like "@summary"
}

// Operation definition
export interface Operation {
  symbol: string
  name: string
  arity: number // Number of stack items consumed
  execute: (stack: StackValue[]) => void // Mutates the stack
  types?: StackValueType[] // Expected input types (optional for now)
  description?: string
}

// Token types for parser
export type TokenType = 'number' | 'string' | 'boolean' | 'operator' | 'word' | 'cellref'

export interface Token {
  type: TokenType
  value: string
  position: number
}

// Parsed elements
export type ParsedElement =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { type: 'literal'; dataType: StackValueType; value: any }
  | { type: 'operation'; symbol: string }
  | { type: 'cellref'; ref: string }
  | { type: 'word'; name: string }

// Stack type is just an array of StackValue
export type Stack = StackValue[]

// Error types
export class StackError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StackError'
  }
}

export class StackUnderflowError extends StackError {
  constructor(operation: string, required: number, actual: number) {
    super(`Stack underflow: ${operation} requires ${required} items, but stack has ${actual}`)
  }
}

export class TypeMismatchError extends StackError {
  constructor(expected: StackValueType | StackValueType[], actual: StackValueType) {
    const expectedStr = Array.isArray(expected) ? expected.join(' or ') : expected
    super(`Type mismatch: expected ${expectedStr}, got ${actual}`)
  }
}

// Mode types for the UI
export type InputMode = 'rpn' | 'llm' | 'mixed'

// State types for stack persistence
export interface ComputationalState {
  stack: StackValue[]
  history: Operation[]
  mode: InputMode
  undoStack: StackValue[][]
  redoStack: StackValue[][]
}
