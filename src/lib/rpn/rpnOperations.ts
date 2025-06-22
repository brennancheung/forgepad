/**
 * Operation registry and implementations for RPN calculator
 * Includes arithmetic, stack manipulation, and comparison operations
 * Using functional programming with mutable stack operations
 */

import { Operation, StackValue } from './rpnTypes'
import {
  popNumber,
  popBoolean,
  pushNumber,
  pushBoolean,
  duplicate,
  drop,
  swap,
  over,
  rotate,
  depth,
  clear,
  executeWithRollback
} from './rpnStack'

// Operation storage
const operations = new Map<string, Operation>()

// Registry functions
export const register = (op: Operation): void => {
  operations.set(op.symbol, op)
}

export const registerMany = (ops: Operation[]): void => {
  ops.forEach(op => register(op))
}

export const getOperation = (symbol: string): Operation | undefined => {
  return operations.get(symbol)
}

export const hasOperation = (symbol: string): boolean => {
  return operations.has(symbol)
}

export const execute = (symbol: string, stackValues: StackValue[]): void => {
  const op = operations.get(symbol)
  if (!op) {
    throw new Error(`Unknown operation: ${symbol}`)
  }

  // Execute with rollback on error
  executeWithRollback(stackValues, () => {
    // Check arity
    if (stackValues.length < op.arity) {
      throw new Error(`Stack underflow: ${symbol} requires ${op.arity} items, but stack has ${stackValues.length}`)
    }
    op.execute(stackValues)
  })
}

export const getAllOperations = (): Operation[] => {
  return Array.from(operations.values())
}

// Arithmetic operations
const arithmeticOps: Operation[] = [
  {
    symbol: '+',
    name: 'add',
    arity: 2,
    description: 'Add top two numbers',
    execute: (stack) => {
      const b = popNumber(stack)
      const a = popNumber(stack)
      pushNumber(stack, a + b)
    },
  },
  {
    symbol: '-',
    name: 'subtract',
    arity: 2,
    description: 'Subtract second from top',
    execute: (stack) => {
      const b = popNumber(stack)
      const a = popNumber(stack)
      pushNumber(stack, a - b)
    },
  },
  {
    symbol: '*',
    name: 'multiply',
    arity: 2,
    description: 'Multiply top two numbers',
    execute: (stack) => {
      const b = popNumber(stack)
      const a = popNumber(stack)
      pushNumber(stack, a * b)
    },
  },
  {
    symbol: '/',
    name: 'divide',
    arity: 2,
    description: 'Divide second by top',
    execute: (stack) => {
      const b = popNumber(stack)
      if (b === 0) {
        throw new Error('Division by zero')
      }
      const a = popNumber(stack)
      pushNumber(stack, a / b)
    },
  },
  {
    symbol: '%',
    name: 'modulo',
    arity: 2,
    description: 'Modulo of second by top',
    execute: (stack) => {
      const b = popNumber(stack)
      if (b === 0) {
        throw new Error('Modulo by zero')
      }
      const a = popNumber(stack)
      pushNumber(stack, a % b)
    },
  },
  {
    symbol: '**',
    name: 'power',
    arity: 2,
    description: 'Raise second to power of top',
    execute: (stack) => {
      const b = popNumber(stack)
      const a = popNumber(stack)
      pushNumber(stack, Math.pow(a, b))
    },
  },
  {
    symbol: 'sqrt',
    name: 'square root',
    arity: 1,
    description: 'Square root of top',
    execute: (stack) => {
      const a = popNumber(stack)
      if (a < 0) {
        throw new Error('Square root of negative number')
      }
      pushNumber(stack, Math.sqrt(a))
    },
  },
  {
    symbol: 'neg',
    name: 'negate',
    arity: 1,
    description: 'Negate top number',
    execute: (stack) => {
      const a = popNumber(stack)
      pushNumber(stack, -a)
    },
  },
  {
    symbol: 'abs',
    name: 'absolute value',
    arity: 1,
    description: 'Absolute value of top',
    execute: (stack) => {
      const a = popNumber(stack)
      pushNumber(stack, Math.abs(a))
    },
  },
  {
    symbol: 'floor',
    name: 'floor',
    arity: 1,
    description: 'Round down to nearest integer',
    execute: (stack) => {
      const a = popNumber(stack)
      pushNumber(stack, Math.floor(a))
    },
  },
  {
    symbol: 'ceil',
    name: 'ceiling',
    arity: 1,
    description: 'Round up to nearest integer',
    execute: (stack) => {
      const a = popNumber(stack)
      pushNumber(stack, Math.ceil(a))
    },
  },
  {
    symbol: 'round',
    name: 'round',
    arity: 1,
    description: 'Round to nearest integer',
    execute: (stack) => {
      const a = popNumber(stack)
      pushNumber(stack, Math.round(a))
    },
  },
]

// Stack manipulation operations
const stackOps: Operation[] = [
  {
    symbol: 'dup',
    name: 'duplicate',
    arity: 1,
    description: 'Duplicate top item',
    execute: (stack) => duplicate(stack),
  },
  {
    symbol: 'drop',
    name: 'drop',
    arity: 1,
    description: 'Remove top item',
    execute: (stack) => drop(stack),
  },
  {
    symbol: 'swap',
    name: 'swap',
    arity: 2,
    description: 'Swap top two items',
    execute: (stack) => swap(stack),
  },
  {
    symbol: 'over',
    name: 'over',
    arity: 2,
    description: 'Copy second item to top',
    execute: (stack) => over(stack),
  },
  {
    symbol: 'rot',
    name: 'rotate',
    arity: 3,
    description: 'Rotate top three items',
    execute: (stack) => rotate(stack),
  },
  {
    symbol: 'depth',
    name: 'stack depth',
    arity: 0,
    description: 'Push stack depth',
    execute: (stack) => pushNumber(stack, depth(stack)),
  },
  {
    symbol: 'clear',
    name: 'clear stack',
    arity: 0,
    description: 'Clear entire stack',
    execute: (stack) => clear(stack),
  },
]

// Comparison operations
const comparisonOps: Operation[] = [
  {
    symbol: '=',
    name: 'equal',
    arity: 2,
    description: 'Test if top two are equal',
    execute: (stack) => {
      const b = popNumber(stack)
      const a = popNumber(stack)
      pushBoolean(stack, a === b)
    },
  },
  {
    symbol: '!=',
    name: 'not equal',
    arity: 2,
    description: 'Test if top two are not equal',
    execute: (stack) => {
      const b = popNumber(stack)
      const a = popNumber(stack)
      pushBoolean(stack, a !== b)
    },
  },
  {
    symbol: '<',
    name: 'less than',
    arity: 2,
    description: 'Test if second < top',
    execute: (stack) => {
      const b = popNumber(stack)
      const a = popNumber(stack)
      pushBoolean(stack, a < b)
    },
  },
  {
    symbol: '>',
    name: 'greater than',
    arity: 2,
    description: 'Test if second > top',
    execute: (stack) => {
      const b = popNumber(stack)
      const a = popNumber(stack)
      pushBoolean(stack, a > b)
    },
  },
  {
    symbol: '<=',
    name: 'less or equal',
    arity: 2,
    description: 'Test if second <= top',
    execute: (stack) => {
      const b = popNumber(stack)
      const a = popNumber(stack)
      pushBoolean(stack, a <= b)
    },
  },
  {
    symbol: '>=',
    name: 'greater or equal',
    arity: 2,
    description: 'Test if second >= top',
    execute: (stack) => {
      const b = popNumber(stack)
      const a = popNumber(stack)
      pushBoolean(stack, a >= b)
    },
  },
]

// Logical operations
const logicalOps: Operation[] = [
  {
    symbol: 'and',
    name: 'logical and',
    arity: 2,
    description: 'Logical AND of top two',
    execute: (stack) => {
      const b = popBoolean(stack)
      const a = popBoolean(stack)
      pushBoolean(stack, a && b)
    },
  },
  {
    symbol: 'or',
    name: 'logical or',
    arity: 2,
    description: 'Logical OR of top two',
    execute: (stack) => {
      const b = popBoolean(stack)
      const a = popBoolean(stack)
      pushBoolean(stack, a || b)
    },
  },
  {
    symbol: 'not',
    name: 'logical not',
    arity: 1,
    description: 'Logical NOT of top',
    execute: (stack) => {
      const a = popBoolean(stack)
      pushBoolean(stack, !a)
    },
  },
]

// Register all operations
registerMany([
  ...arithmeticOps,
  ...stackOps,
  ...comparisonOps,
  ...logicalOps,
])

// Helper function to check if a string is an operation
export const isOperation = (symbol: string): boolean => {
  return hasOperation(symbol)
}

// Helper to get operation info for UI
export const getOperationInfo = (symbol: string): Operation | undefined => {
  return getOperation(symbol)
}

// Group operations by category for UI
export const operationCategories = {
  arithmetic: arithmeticOps,
  stack: stackOps,
  comparison: comparisonOps,
  logical: logicalOps,
}