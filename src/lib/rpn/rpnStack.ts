/**
 * Stack operations for RPN calculator
 * Pragmatic approach with mutation but type safety
 */

import {
  StackValue,
  NumberValue,
  StringValue,
  BooleanValue,
  ArrayValue,
  CellValue,
  StackUnderflowError,
  TypeMismatchError,
  StackValueType,
} from './rpnTypes'
import { Id } from '@convex/_generated/dataModel'

// Stack operations - mutate the array for efficiency

export const push = (stack: StackValue[], value: StackValue): void => {
  stack.push(value)
}

export const pop = (stack: StackValue[]): StackValue | undefined => {
  return stack.pop()
}

export const peek = (stack: StackValue[]): StackValue | undefined => {
  return stack[stack.length - 1]
}

export const peekNth = (stack: StackValue[], n: number): StackValue | undefined => {
  // n is 1-based from top (1 = top, 2 = second from top)
  if (n < 1 || n > stack.length) {
    return undefined
  }
  return stack[stack.length - n]
}

// Type checking without popping
export const checkDepth = (stack: StackValue[], required: number, operation: string): void => {
  if (stack.length < required) {
    throw new StackUnderflowError(operation, required, stack.length)
  }
}

export const checkTypes = (stack: StackValue[], types: StackValueType[], operation: string): void => {
  checkDepth(stack, types.length, operation)
  
  for (let i = 0; i < types.length; i++) {
    const item = stack[stack.length - types.length + i]
    if (item.type !== types[i]) {
      // Allow cell references to be used as strings
      if (!(types[i] === 'string' && item.type === 'cell')) {
        throw new TypeMismatchError(types[i], item.type)
      }
    }
  }
}

// Type-safe push operations

export const pushNumber = (stack: StackValue[], value: number): void => {
  push(stack, {
    type: 'number',
    value,
    ephemeral: true,
  } as NumberValue)
}

export const pushString = (stack: StackValue[], value: string): void => {
  push(stack, {
    type: 'string',
    value,
    ephemeral: true,
  } as StringValue)
}

export const pushBoolean = (stack: StackValue[], value: boolean): void => {
  push(stack, {
    type: 'boolean',
    value,
    ephemeral: true,
  } as BooleanValue)
}

export const pushArray = (stack: StackValue[], value: StackValue[]): void => {
  push(stack, {
    type: 'array',
    value,
    ephemeral: true,
  } as ArrayValue)
}

export const pushCell = (stack: StackValue[], ref: Id<"cells"> | string): void => {
  push(stack, {
    type: 'cell',
    value: ref,
    ephemeral: false,
  } as CellValue)
}

// Type-safe pop operations - these mutate the stack

export const popNumber = (stack: StackValue[]): number => {
  const value = pop(stack)
  if (!value) {
    throw new StackUnderflowError('popNumber', 1, 0)
  }
  if (value.type !== 'number') {
    throw new TypeMismatchError('number', value.type)
  }
  return value.value
}

export const popString = (stack: StackValue[]): string => {
  const value = pop(stack)
  if (!value) {
    throw new StackUnderflowError('popString', 1, 0)
  }
  if (value.type !== 'string' && value.type !== 'cell') {
    throw new TypeMismatchError(['string', 'cell'], value.type)
  }
  // TODO: If cell type, fetch content from database
  return value.value
}

export const popBoolean = (stack: StackValue[]): boolean => {
  const value = pop(stack)
  if (!value) {
    throw new StackUnderflowError('popBoolean', 1, 0)
  }
  if (value.type !== 'boolean') {
    throw new TypeMismatchError('boolean', value.type)
  }
  return value.value
}

export const popArray = (stack: StackValue[]): StackValue[] => {
  const value = pop(stack)
  if (!value) {
    throw new StackUnderflowError('popArray', 1, 0)
  }
  if (value.type !== 'array') {
    throw new TypeMismatchError('array', value.type)
  }
  return value.value
}

// Stack manipulation operations

export const duplicate = (stack: StackValue[]): void => {
  const top = peek(stack)
  if (!top) {
    throw new StackUnderflowError('dup', 1, 0)
  }
  push(stack, { ...top })
}

export const drop = (stack: StackValue[]): void => {
  if (stack.length === 0) {
    throw new StackUnderflowError('drop', 1, 0)
  }
  stack.pop()
}

export const swap = (stack: StackValue[]): void => {
  checkDepth(stack, 2, 'swap')
  const a = stack[stack.length - 1]
  const b = stack[stack.length - 2]
  stack[stack.length - 1] = b
  stack[stack.length - 2] = a
}

export const rotate = (stack: StackValue[]): void => {
  checkDepth(stack, 3, 'rot')
  const c = stack[stack.length - 1]
  const b = stack[stack.length - 2]
  const a = stack[stack.length - 3]
  stack[stack.length - 3] = b
  stack[stack.length - 2] = c
  stack[stack.length - 1] = a
}

export const over = (stack: StackValue[]): void => {
  checkDepth(stack, 2, 'over')
  const second = stack[stack.length - 2]
  push(stack, { ...second })
}

export const pick = (stack: StackValue[], n: number): void => {
  const value = peekNth(stack, n)
  if (!value) {
    throw new StackUnderflowError('pick', n, stack.length)
  }
  push(stack, { ...value })
}

export const roll = (stack: StackValue[], n: number): void => {
  if (n < 1 || n > stack.length) {
    throw new StackUnderflowError('roll', n, stack.length)
  }
  
  const index = stack.length - n
  const [value] = stack.splice(index, 1)
  stack.push(value)
}

// Utility functions

export const clear = (stack: StackValue[]): void => {
  stack.length = 0
}

export const depth = (stack: StackValue[]): number => {
  return stack.length
}

// Create a snapshot for rollback
export const snapshot = (stack: StackValue[]): StackValue[] => {
  return JSON.parse(JSON.stringify(stack))
}

// Execute an operation with automatic rollback on error
export const executeWithRollback = <T>(
  stack: StackValue[],
  operation: () => T
): T => {
  const backup = snapshot(stack)
  try {
    return operation()
  } catch (error) {
    // Restore the stack on error
    stack.length = 0
    stack.push(...backup)
    throw error
  }
}