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
export function parseSourceReferences(text: string): SourceReference[] {
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

/**
 * Extract value from source based on path
 */
export function extractValueFromPath(value: unknown, path?: string): unknown {
  if (!path) return value

  let current = value
  
  // Handle array indices like [0], [1], etc.
  const arrayMatches = path.matchAll(/\[(\d+)\]/g)
  for (const match of arrayMatches) {
    const index = parseInt(match[1], 10)
    if (Array.isArray(current) && index >= 0 && index < current.length) {
      current = current[index]
    } else {
      return undefined
    }
  }

  // Handle object properties like .prop, .nested.prop
  const propMatches = path.matchAll(/\.([a-zA-Z0-9_]+)/g)
  for (const match of propMatches) {
    const prop = match[1]
    if (current && typeof current === 'object' && prop in current) {
      current = (current as Record<string, unknown>)[prop]
    } else {
      return undefined
    }
  }

  return current
}

/**
 * Interpolate sources in text
 */
export function interpolateSources(
  text: string,
  sources: Map<string, Source>
): string {
  const references = parseSourceReferences(text)
  
  // Sort references by position (descending) to replace from end to start
  references.sort((a, b) => b.start - a.start)
  
  let result = text
  
  for (const ref of references) {
    const source = sources.get(ref.name)
    if (!source) continue
    
    const value = extractValueFromPath(source.value, ref.path)
    
    // Convert value to string
    let stringValue: string
    if (value === undefined || value === null) {
      stringValue = ''
    } else if (typeof value === 'string') {
      stringValue = value
    } else if (typeof value === 'object') {
      stringValue = JSON.stringify(value, null, 2)
    } else {
      stringValue = String(value)
    }
    
    // Replace the reference with the value
    result = result.substring(0, ref.start) + stringValue + result.substring(ref.end)
  }
  
  return result
}

/**
 * Get unique source names referenced in text
 */
export function getReferencedSourceNames(text: string): Set<string> {
  const references = parseSourceReferences(text)
  return new Set(references.map(ref => ref.name))
}

/**
 * Validate that all referenced sources exist
 */
export function validateSourceReferences(
  text: string,
  availableSources: Set<string>
): { valid: boolean; missing: string[] } {
  const referenced = getReferencedSourceNames(text)
  const missing: string[] = []
  
  for (const name of referenced) {
    if (!availableSources.has(name)) {
      missing.push(name)
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  }
}