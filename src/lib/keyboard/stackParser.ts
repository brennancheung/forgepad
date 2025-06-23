import { ParsedStackCommand, StackOperand } from './stackTypes'

/**
 * Parse a command buffer into a stack command
 * Examples:
 * - "3g" -> { operator: 'g', operand: { type: 'position', value: 3 } }
 * - "3d" -> { operator: 'd', operand: { type: 'count', value: 3 } }
 * - "gg" -> { operator: 'gg', operand: { type: 'special', value: 'bottom' } }
 * - "@foo" -> { operator: '@', operand: { type: 'named', value: 'foo' } }
 */
export const parseStackCommand = (buffer: string): ParsedStackCommand | null => {
  if (!buffer) return null
  
  // Special two-character commands
  if (buffer === 'gg') {
    return {
      operator: 'gg',
      operand: { type: 'special', value: 'bottom' },
      raw: buffer
    }
  }
  
  // Named cell reference: @name
  const namedMatch = buffer.match(/^@(\w+)$/)
  if (namedMatch) {
    return {
      operator: '@',
      operand: { type: 'named', value: namedMatch[1] },
      raw: buffer
    }
  }
  
  // Position command: 3g, 10g
  const positionMatch = buffer.match(/^(\d+)g$/)
  if (positionMatch) {
    return {
      operator: 'g',
      operand: { type: 'position', value: parseInt(positionMatch[1]) },
      raw: buffer
    }
  }
  
  // Count prefix commands: 3d, 3y, 3p
  const countMatch = buffer.match(/^(\d+)([a-zA-Z])$/)
  if (countMatch) {
    const count = parseInt(countMatch[1])
    const op = countMatch[2]
    
    // Determine if this is a count or position based on operator
    const countOperators = ['d', 'y', 'x', 'p', '+', '-', '*', '/']
    const operandType = countOperators.includes(op) ? 'count' : 'position'
    
    return {
      operator: op,
      operand: { type: operandType, value: count },
      raw: buffer
    }
  }
  
  // Single character commands
  if (buffer.length === 1) {
    const singleCharCommands: Record<string, StackOperand | undefined> = {
      'G': { type: 'special', value: 'top' },
      'd': { type: 'count', value: 1 },
      'y': { type: 'count', value: 1 },
      'p': { type: 'count', value: 1 },
      'x': { type: 'count', value: 1 },
      's': { type: 'special', value: 'swap' },
      'r': { type: 'special', value: 'rotate' },
      'j': { type: 'count', value: 1 },
      'k': { type: 'count', value: -1 },
    }
    
    const operand = singleCharCommands[buffer]
    if (operand) {
      return {
        operator: buffer,
        operand,
        raw: buffer
      }
    }
  }
  
  // Range commands: 3,7d (delete lines 3-7)
  const rangeMatch = buffer.match(/^(\d+),(\d+)([a-zA-Z])$/)
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1])
    const end = parseInt(rangeMatch[2])
    const op = rangeMatch[3]
    
    return {
      operator: op,
      operand: { type: 'range', value: [start, end] },
      raw: buffer
    }
  }
  
  // Delete/yank to position: d3g, y3g
  const deleteToMatch = buffer.match(/^([dyx])(\d+)g$/)
  if (deleteToMatch) {
    const op = deleteToMatch[1]
    const position = parseInt(deleteToMatch[2])
    
    return {
      operator: op + 'g',  // Compound operator: dg, yg, xg
      operand: { type: 'position', value: position },
      raw: buffer
    }
  }
  
  return null
}

/**
 * Check if a partial command could become valid
 */
export const isPartialStackCommand = (buffer: string): boolean => {
  // Check if it could be building a multi-char command
  if (buffer === 'g') return true  // Could become gg or g3
  
  // Check if it's building a number
  if (/^\d+$/.test(buffer)) return true  // Could become 3g, 3d, etc.
  
  // Check if it's building a range
  if (/^\d+,$/.test(buffer)) return true  // Could become 3,7d
  if (/^\d+,\d+$/.test(buffer)) return true  // Needs operator
  
  // Check if it's building a delete-to command
  if (/^[dyx]\d*$/.test(buffer)) return true  // Could become d3g
  
  // Check if it's building a named reference
  if (buffer === '@') return true  // Could become @name
  if (/^@\w*$/.test(buffer)) return true  // Building name
  
  return false
}

/**
 * Get a human-readable description of a command
 */
export const describeStackCommand = (cmd: ParsedStackCommand): string => {
  const { operator, operand } = cmd
  
  if (!operand) return operator || 'unknown'
  
  switch (operand.type) {
    case 'count':
      const count = operand.value as number
      switch (operator) {
        case 'd': return `Delete ${count} item${count !== 1 ? 's' : ''}`
        case 'y': return `Yank ${count} item${count !== 1 ? 's' : ''}`
        case 'j': return `Move down ${Math.abs(count)} position${count !== 1 ? 's' : ''}`
        case 'k': return `Move up ${Math.abs(count)} position${count !== 1 ? 's' : ''}`
        default: return `${operator} ${count} items`
      }
      
    case 'position':
      const pos = operand.value as number
      switch (operator) {
        case 'g': return `Go to position ${pos}`
        case 'dg': return `Delete to position ${pos}`
        case 'yg': return `Yank to position ${pos}`
        default: return `${operator} position ${pos}`
      }
      
    case 'range':
      const [start, end] = operand.value as [number, number]
      return `${operator} positions ${start}-${end}`
      
    case 'named':
      return `Go to cell @${operand.value}`
      
    case 'special':
      switch (operand.value) {
        case 'top': return 'Go to top of stack'
        case 'bottom': return 'Go to bottom of stack'
        case 'swap': return 'Swap top two items'
        case 'rotate': return 'Rotate top three items'
        default: return operand.value as string
      }
      
    default:
      return `${operator} ${operand.value}`
  }
}