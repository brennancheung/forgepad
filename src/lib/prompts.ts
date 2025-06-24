/**
 * Extract variables from a template string
 * Variables are in the format {{variableName}}
 */
export function extractVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g
  const variables = new Set<string>()
  let match
  while ((match = regex.exec(template)) !== null) {
    variables.add(match[1])
  }
  return Array.from(variables)
}

/**
 * Substitute variables in a template with provided values
 * @param template The template string with {{variables}}
 * @param values Object mapping variable names to values
 * @returns The template with variables replaced
 */
export function substituteVariables(
  template: string, 
  values: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return values[variable] || match
  })
}

/**
 * Validate a prompt name
 * Must be alphanumeric with underscores, max 50 characters
 */
export function validatePromptName(name: string): { valid: boolean; error?: string } {
  if (!name) {
    return { valid: false, error: 'Name is required' }
  }
  if (name.length > 50) {
    return { valid: false, error: 'Name must be 50 characters or less' }
  }
  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    return { valid: false, error: 'Name must contain only letters, numbers, and underscores' }
  }
  return { valid: true }
}