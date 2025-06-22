/**
 * RPN Parser and Tokenizer
 * Tokenizes input and converts to executable elements
 * Using functional programming patterns
 */

import { Token, TokenType, ParsedElement, StackValueType } from './rpnTypes'
import { isOperation } from './rpnOperations'

// Token patterns
const patterns: Array<{ regex: RegExp; type: TokenType }> = [
  { regex: /^-?\d+(\.\d+)?/, type: 'number' },
  { regex: /^"([^"\\]|\\.)*"/, type: 'string' },
  { regex: /^(true|false)/, type: 'boolean' },
  { regex: /^@[a-zA-Z_]\w*/, type: 'cellref' },
  { regex: /^#\d+/, type: 'cellref' },
  { regex: /^(==|!=|<=|>=|<>|\*\*|[+\-*/%<>=])/, type: 'operator' },
  { regex: /^[a-zA-Z_]\w*/, type: 'word' },
]

// Tokenize input string into tokens
export const tokenize = (input: string): Token[] => {
  const tokens: Token[] = []
  let remaining = input.trim()
  let position = 0

  while (remaining.length > 0) {
    // Skip whitespace
    const whitespaceMatch = remaining.match(/^\s+/)
    if (whitespaceMatch) {
      position += whitespaceMatch[0].length
      remaining = remaining.slice(whitespaceMatch[0].length)
      continue
    }

    let matched = false

    for (const pattern of patterns) {
      const match = remaining.match(pattern.regex)
      if (match) {
        tokens.push({
          type: pattern.type,
          value: match[0],
          position,
        })
        position += match[0].length
        remaining = remaining.slice(match[0].length)
        matched = true
        break
      }
    }

    if (!matched) {
      throw new Error(`Unknown token at position ${position}: "${remaining[0]}"`)
    }
  }

  return tokens
}

// Parse a single token into a parsed element
export const parseToken = (token: Token): ParsedElement => {
  switch (token.type) {
    case 'number':
      return {
        type: 'literal',
        dataType: 'number' as StackValueType,
        value: parseFloat(token.value),
      }

    case 'string':
      // Remove quotes and handle escape sequences
      const content = token.value
        .slice(1, -1) // Remove quotes
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r')
        .replace(/\\\\/g, '\\')
        .replace(/\\"/g, '"')
      return {
        type: 'literal',
        dataType: 'string' as StackValueType,
        value: content,
      }

    case 'boolean':
      return {
        type: 'literal',
        dataType: 'boolean' as StackValueType,
        value: token.value === 'true',
      }

    case 'cellref':
      return {
        type: 'cellref',
        ref: token.value,
      }

    case 'operator':
      // Map some alternative operators
      let symbol = token.value
      if (symbol === '<>') symbol = '!=' // Alternative not-equal

      if (isOperation(symbol)) {
        return {
          type: 'operation',
          symbol,
        }
      }
      // If not a known operation, treat as word
      return {
        type: 'word',
        name: token.value,
      }

    case 'word':
      // Check if it's a known operation
      if (isOperation(token.value)) {
        return {
          type: 'operation',
          symbol: token.value,
        }
      }
      // Otherwise it's a word (for future: user-defined words)
      return {
        type: 'word',
        name: token.value,
      }

    default:
      throw new Error(`Unknown token type: ${token.type}`)
  }
}

// Parse input string into array of parsed elements
export const parse = (input: string): ParsedElement[] => {
  const tokens = tokenize(input)
  return tokens.map(parseToken)
}

// Helper to detect if input looks like RPN
export const looksLikeRPN = (input: string): boolean => {
  // Check for patterns that suggest RPN input
  const rpnPatterns = [
    /^\s*-?\d+/, // Starts with number
    /^\s*"/, // Starts with string
    /^\s*(true|false)/, // Starts with boolean
    /^\s*[+\-*/%]/, // Starts with operator
    /^\s*@\w+/, // Starts with cell reference
    /^\s*#\d+/, // Starts with stack position reference
    /^\s*(dup|drop|swap|over|rot|clear|depth)/, // Stack operations
  ]

  return rpnPatterns.some((pattern) => pattern.test(input))
}