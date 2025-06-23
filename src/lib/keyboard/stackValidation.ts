/**
 * Type validation for stack operations
 */

export type StackItemType = 'number' | 'string' | 'array' | 'boolean' | 'object' | 'cell' | 'unknown'

export interface StackItem {
  position: number
  type: StackItemType
  value: unknown
}

/**
 * Operations that require specific types
 */
export const typeRequirements: Record<string, StackItemType[]> = {
  // Math operations require numbers
  'ADD': ['number'],
  'SUBTRACT': ['number'],
  'MULTIPLY': ['number'],
  'DIVIDE': ['number'],
  'MODULO': ['number'],
  'POWER': ['number'],
  
  // String operations
  'CONCAT': ['string'],
  'SPLIT': ['string'],
  'JOIN': ['array'],
  
  // Array operations
  'LENGTH': ['string', 'array'],
  'REVERSE': ['string', 'array'],
  'SORT': ['array'],
  'MAP': ['array'],
  'FILTER': ['array'],
  'REDUCE': ['array'],
  
  // Boolean operations
  'AND': ['boolean'],
  'OR': ['boolean'],
  'NOT': ['boolean'],
  
  // Comparison (any type)
  'EQUALS': [],
  'LESS_THAN': ['number', 'string'],
  'GREATER_THAN': ['number', 'string'],
}

/**
 * Check if an operation is valid for given item types
 */
export const validateOperation = (
  operation: string,
  itemTypes: StackItemType[]
): { valid: boolean; error?: string } => {
  const requirements = typeRequirements[operation]
  
  if (!requirements) {
    // Unknown operation - allow it
    return { valid: true }
  }
  
  if (requirements.length === 0) {
    // No type requirements
    return { valid: true }
  }
  
  // Check if all items match required types
  for (let i = 0; i < itemTypes.length; i++) {
    const itemType = itemTypes[i]
    if (!requirements.includes(itemType)) {
      return {
        valid: false,
        error: `Operation ${operation} requires ${requirements.join(' or ')} types, but item ${i + 1} is ${itemType}`
      }
    }
  }
  
  return { valid: true }
}

/**
 * Infer the type of a value
 */
export const inferType = (value: unknown): StackItemType => {
  if (value === null || value === undefined) return 'unknown'
  
  const type = typeof value
  
  switch (type) {
    case 'number':
      return 'number'
    case 'string':
      return 'string'
    case 'boolean':
      return 'boolean'
    case 'object':
      if (Array.isArray(value)) return 'array'
      if (value && typeof value === 'object' && 'cellId' in value) return 'cell'
      return 'object'
    default:
      return 'unknown'
  }
}

/**
 * Check if items can be operated on together
 */
export const areTypesCompatible = (
  type1: StackItemType,
  type2: StackItemType,
  operation: string
): boolean => {
  // Same types are usually compatible
  if (type1 === type2) return true
  
  // Numbers can be compared with strings
  if (operation.includes('COMPARE') || operation === 'EQUALS') {
    return true
  }
  
  // Special cases
  const compatiblePairs: Record<string, string[]> = {
    'CONCAT': ['string'],  // Can concat anything to string
    'ADD': ['number'],     // Can only add numbers
  }
  
  const allowed = compatiblePairs[operation]
  if (allowed) {
    return allowed.includes(type1) && allowed.includes(type2)
  }
  
  return false
}

/**
 * Validate a stack operation with type checking
 */
export const validateStackOperation = (
  operation: string,
  items: StackItem[]
): { valid: boolean; error?: string } => {
  if (items.length === 0) {
    return { valid: false, error: 'No items to operate on' }
  }
  
  const types = items.map(item => item.type)
  return validateOperation(operation, types)
}