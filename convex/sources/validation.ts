import { Id } from '../_generated/dataModel'
import { SourceType, SourceScope, SourceValue } from '../types/sources'

const validators: Record<SourceType, (value: unknown) => boolean> = {
  string: (value) => typeof value === 'string',
  array: (value) => Array.isArray(value),
  json: (value) => {
    try {
      // Must be a plain object (not array, null, or primitive)
      return value !== null && typeof value === 'object' && !Array.isArray(value)
    } catch {
      return false
    }
  },
}

export function validateSourceValue(type: SourceType, value: unknown): boolean {
  const validator = validators[type]
  return validator ? validator(value) : false
}

const sanitizers: Record<SourceType, (value: unknown) => SourceValue> = {
  string: (value) => String(value),
  array: (value) => Array.isArray(value) ? value : [],
  json: (value) => {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>
    }
    return {}
  },
}

export function sanitizeSourceValue(type: SourceType, value: unknown): SourceValue {
  const sanitizer = sanitizers[type]
  if (!sanitizer) {
    throw new Error(`Unknown source type: ${type}`)
  }
  return sanitizer(value)
}

const errorMessages: Record<SourceType, string> = {
  string: 'Value must be a string',
  array: 'Value must be an array',
  json: 'Value must be a JSON object (not an array or primitive)',
}

export function getSourceValueError(type: SourceType, value: unknown): string | null {
  if (!validateSourceValue(type, value)) {
    return errorMessages[type] || 'Invalid source type'
  }
  return null
}

export function validateSourceScope(
  userId: Id<'users'>,
  workspaceId?: Id<'workspaces'>,
  stackId?: Id<'stacks'>
): boolean {
  // userId is always required
  if (!userId) return false
  
  // If stackId is set, workspaceId must also be set
  if (stackId && !workspaceId) return false
  
  return true
}

export function validateSourceName(name: string): boolean {
  // Name must be non-empty and contain only alphanumeric and underscore
  if (!name || name.length === 0) return false
  if (name.length > 100) return false
  
  // Must start with letter or underscore, then allow alphanumeric and underscore
  const validNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
  return validNameRegex.test(name)
}

export function getSourceNameError(name: string): string | null {
  if (!name || name.length === 0) {
    return 'Name is required'
  }
  if (name.length > 100) {
    return 'Name must be less than 100 characters'
  }
  const validNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/
  if (!validNameRegex.test(name)) {
    return 'Name must start with a letter or underscore, followed by letters, numbers, or underscores'
  }
  return null
}