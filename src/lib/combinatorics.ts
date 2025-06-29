import { parseSourceVariables, getEnabledVariables } from '@/lib/sources/types'

export interface SourceValue {
  name: string
  value: unknown
}

export interface CombinatoricResult {
  [key: string]: string
}

// Helper functions for value type checking
const isStringValue = (value: unknown): value is string => typeof value === 'string'

const isStringArray = (value: unknown): value is string[] => 
  Array.isArray(value) && value.every(v => typeof v === 'string')

const hasElements = <T>(arr: T[]): boolean => arr.length > 0

// Process a single source value into valid strings
const processSourceValue = (value: unknown): string[] | null => {
  if (isStringValue(value)) return [value]
  
  if (isStringArray(value) && hasElements(value)) return value
  
  if (!Array.isArray(value)) return null
  
  // Try to parse as VariableItems
  const variableItems = parseSourceVariables(value)
  const enabledLabels = getEnabledVariables(variableItems)
  
  return hasElements(enabledLabels) ? enabledLabels : null
}

/**
 * Extracts valid values for combinatoric generation
 * - Single strings are kept as is
 * - Arrays of strings are kept (even if empty)
 * - Arrays of VariableItems are filtered to only enabled items
 * - All other types are discarded
 */
const extractValidValues = (sources: SourceValue[]): Record<string, string[]> => {
  const validValues: Record<string, string[]> = {}
  
  for (const source of sources) {
    const { name, value } = source
    const processedValue = processSourceValue(value)
    
    if (processedValue) validValues[name] = processedValue
  }
  
  return validValues
}

// Generate combinations for a single key-value pair
const generateCombinationsForKey = (
  existingCombinations: CombinatoricResult[],
  key: string,
  values: string[]
): CombinatoricResult[] => {
  const newCombinations: CombinatoricResult[] = []
  
  for (const combination of existingCombinations) {
    for (const value of values) {
      newCombinations.push({
        ...combination,
        [key]: value
      })
    }
  }
  
  return newCombinations
}

/**
 * Generates all combinatoric combinations from sources
 * @param sources Array of source objects with name and value
 * @returns Array of all possible combinations
 */
export const generateCombinations = (sources: SourceValue[]): CombinatoricResult[] => {
  const validValues = extractValidValues(sources)
  const keys = Object.keys(validValues)
  
  if (!hasElements(keys)) return []
  
  // Initialize with empty combination
  let combinations: CombinatoricResult[] = [{}]
  
  // For each key, multiply existing combinations by all possible values
  for (const key of keys) {
    combinations = generateCombinationsForKey(combinations, key, validValues[key])
  }
  
  return combinations
}

/**
 * Counts total number of combinations without generating them
 * Useful for checking if generation would be too large
 */
export const countCombinations = (sources: SourceValue[]): number => {
  const validValues = extractValidValues(sources)
  const keys = Object.keys(validValues)
  
  if (!hasElements(keys)) return 0
  
  return keys.reduce((total, key) => total * validValues[key].length, 1)
}