export type VariableItem = {
  label: string
  enable: boolean
}

// Helper to parse content into unknown
const parseContent = (content: string | unknown): unknown => {
  if (typeof content === 'string') return JSON.parse(content || '[]')
  return content
}

// Convert a single item to VariableItem format
const convertToVariableItem = (item: unknown): VariableItem | null => {
  // Handle legacy string arrays
  if (typeof item === 'string') return { label: item, enable: true }
  
  // Handle new format with enable property
  if (typeof item === 'object' && item && 'label' in item && 'enable' in item) {
    return item as VariableItem
  }
  
  return null
}

/**
 * Parse source content string into a list of variable items
 * @param content JSON string containing variable items or string array
 * @returns Array of VariableItem objects
 */
export const parseSourceVariables = (content?: string | unknown): VariableItem[] => {
  try {
    const parsed = parseContent(content)
    
    if (!Array.isArray(parsed)) return []
    
    return parsed
      .map(convertToVariableItem)
      .filter((item): item is VariableItem => item !== null)
  } catch {
    return []
  }
}

/**
 * Filter variable items to only include enabled ones
 * @param items Array of VariableItem objects
 * @returns Array of enabled item labels
 */
export const getEnabledVariables = (items: VariableItem[]): string[] => 
  items
    .filter(item => item.enable)
    .map(item => item.label)

/**
 * Convert variable items to JSON string for storage
 * @param items Array of VariableItem objects
 * @returns JSON string
 */
export const stringifyVariableItems = (items: VariableItem[]): string => 
  JSON.stringify(items)