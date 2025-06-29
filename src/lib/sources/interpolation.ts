import { Source } from '@convex/types/sources'

export interface SourceReference {
  raw: string // The full match including {{}}
  type: 'source' | 'user' | 'workspace' | 'stack'
  name: string
  path?: string // For array indices or JSON properties
  start: number // Position in text
  end: number
}

// Regex to match source references
// Matches: {{source:name}}, {{user:name}}, {{source:name[0]}}, {{source:name.prop}}
// Source names must start with letter/underscore, then alphanumeric/underscore
const SOURCE_REFERENCE_REGEX = /\{\{(source|user|workspace|stack):([a-zA-Z_][a-zA-Z0-9_]*)(\[[0-9]+\]|\.[a-zA-Z0-9_]+)*\}\}/g

/**
 * Parse source references from text
 */
export const parseSourceReferences = (text: string): SourceReference[] => {
  const references: SourceReference[] = []
  let match: RegExpExecArray | null

  // Reset regex state
  SOURCE_REFERENCE_REGEX.lastIndex = 0

  while ((match = SOURCE_REFERENCE_REGEX.exec(text)) !== null) {
    const [raw, type, name, pathPart = ''] = match
    
    references.push({
      raw,
      type: type as SourceReference['type'],
      name,
      path: pathPart || undefined,
      start: match.index,
      end: match.index + raw.length,
    })
  }

  return references
}

// Extract array index from path segment
const extractArrayIndex = (current: unknown, match: RegExpMatchArray): unknown => {
  const index = parseInt(match[1], 10)
  if (!Array.isArray(current)) return undefined
  if (index < 0 || index >= current.length) return undefined
  return current[index]
}

// Extract object property from path segment
const extractObjectProperty = (current: unknown, prop: string): unknown => {
  if (!current || typeof current !== 'object') return undefined
  if (!(prop in current)) return undefined
  return (current as Record<string, unknown>)[prop]
}

/**
 * Extract value from source based on path
 */
export const extractValueFromPath = (value: unknown, path?: string): unknown => {
  if (!path) return value

  let current = value
  
  // Handle array indices like [0], [1], etc.
  const arrayMatches = path.matchAll(/\[(\d+)\]/g)
  for (const match of arrayMatches) {
    current = extractArrayIndex(current, match)
    if (current === undefined) return undefined
  }

  // Handle object properties like .prop, .nested.prop
  const propMatches = path.matchAll(/\.([a-zA-Z0-9_]+)/g)
  for (const match of propMatches) {
    current = extractObjectProperty(current, match[1])
    if (current === undefined) return undefined
  }

  return current
}

// Convert value to string representation
const valueToString = (value: unknown): string => {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

/**
 * Interpolate sources in text
 */
export const interpolateSources = (
  text: string,
  sources: Map<string, Source>
): string => {
  const references = parseSourceReferences(text)
  
  // Sort references by position (descending) to replace from end to start
  references.sort((a, b) => b.start - a.start)
  
  let result = text
  
  for (const ref of references) {
    const source = sources.get(ref.name)
    if (!source) continue
    
    const value = extractValueFromPath(source.value, ref.path)
    const stringValue = valueToString(value)
    
    // Replace the reference with the value
    result = result.substring(0, ref.start) + stringValue + result.substring(ref.end)
  }
  
  return result
}

/**
 * Get unique source names referenced in text
 */
export const getReferencedSourceNames = (text: string): Set<string> => {
  const references = parseSourceReferences(text)
  return new Set(references.map(ref => ref.name))
}

/**
 * Validate that all referenced sources exist
 */
export const validateSourceReferences = (
  text: string,
  availableSources: Set<string>
): { valid: boolean; missing: string[] } => {
  const referenced = getReferencedSourceNames(text)
  const missing: string[] = []
  
  for (const name of referenced) {
    if (!availableSources.has(name)) missing.push(name)
  }
  
  return {
    valid: missing.length === 0,
    missing,
  }
}