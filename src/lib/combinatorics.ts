export interface SourceValue {
  name: string
  value: unknown
}

export interface CombinatoricResult {
  [key: string]: string
}

/**
 * Extracts valid values for combinatoric generation
 * - Single strings are kept as is
 * - Arrays of strings are kept
 * - All other types are discarded
 */
function extractValidValues(sources: SourceValue[]): Record<string, string[]> {
  const validValues: Record<string, string[]> = {}
  
  for (const source of sources) {
    const { name, value } = source
    
    // Single string
    if (typeof value === 'string') {
      validValues[name] = [value]
    }
    // Array of strings
    else if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
      validValues[name] = value
    }
    // Silently discard other types
  }
  
  return validValues
}

/**
 * Generates all combinatoric combinations from sources
 * @param sources Array of source objects with name and value
 * @returns Array of all possible combinations
 */
export function generateCombinations(sources: SourceValue[]): CombinatoricResult[] {
  const validValues = extractValidValues(sources)
  const keys = Object.keys(validValues)
  
  if (keys.length === 0) {
    return []
  }
  
  // Initialize with empty combination
  let combinations: CombinatoricResult[] = [{}]
  
  // For each key, multiply existing combinations by all possible values
  for (const key of keys) {
    const values = validValues[key]
    const newCombinations: CombinatoricResult[] = []
    
    for (const combination of combinations) {
      for (const value of values) {
        newCombinations.push({
          ...combination,
          [key]: value
        })
      }
    }
    
    combinations = newCombinations
  }
  
  return combinations
}

/**
 * Counts total number of combinations without generating them
 * Useful for checking if generation would be too large
 */
export function countCombinations(sources: SourceValue[]): number {
  const validValues = extractValidValues(sources)
  const keys = Object.keys(validValues)
  
  if (keys.length === 0) {
    return 0
  }
  
  return keys.reduce((total, key) => {
    return total * validValues[key].length
  }, 1)
}