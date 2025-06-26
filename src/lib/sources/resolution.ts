import { Source, SourceScope, SourceResolutionContext, getResolutionOrder } from '@convex/types/sources'

/**
 * Resolve a source by name following the scope hierarchy
 */
export function resolveSourceByName(
  name: string,
  sources: Source[],
  context: SourceResolutionContext
): Source | null {
  // Get resolution order based on context
  const order = getResolutionOrder(context)
  
  // Try each scope in order
  for (const scope of order) {
    const source = findSourceInScope(name, sources, scope, context)
    if (source) return source
  }
  
  return null
}

/**
 * Find a source in a specific scope
 */
function findSourceInScope(
  name: string,
  sources: Source[],
  scope: SourceScope,
  context: SourceResolutionContext
): Source | null {
  return sources.find(source => {
    if (source.name !== name) return false
    
    switch (scope) {
      case 'stack':
        return source.stackId === context.stackId
      case 'workspace':
        return source.workspaceId === context.workspaceId && !source.stackId
      case 'user':
        return source.userId === context.userId && !source.workspaceId && !source.stackId
      default:
        return false
    }
  }) || null
}

/**
 * Resolve a source by explicit scope prefix
 */
export function resolveSourceByPrefix(
  type: 'source' | 'user' | 'workspace' | 'stack',
  name: string,
  sources: Source[],
  context: SourceResolutionContext
): Source | null {
  if (type === 'source') {
    // Regular resolution with hierarchy
    return resolveSourceByName(name, sources, context)
  }
  
  // Explicit scope resolution
  const scope = type as SourceScope
  return findSourceInScope(name, sources, scope, context)
}

/**
 * Build a map of all resolvable sources in the current context
 */
export function buildSourceMap(
  sources: Source[],
  context: SourceResolutionContext
): Map<string, Source> {
  const sourceMap = new Map<string, Source>()
  const order = getResolutionOrder(context)
  
  // Add sources in reverse order so higher priority sources override
  for (let i = order.length - 1; i >= 0; i--) {
    const scope = order[i]
    const scopeSources = sources.filter(source => {
      switch (scope) {
        case 'stack':
          return source.stackId === context.stackId
        case 'workspace':
          return source.workspaceId === context.workspaceId && !source.stackId
        case 'user':
          return source.userId === context.userId && !source.workspaceId && !source.stackId
        default:
          return false
      }
    })
    
    for (const source of scopeSources) {
      sourceMap.set(source.name, source)
    }
  }
  
  return sourceMap
}

/**
 * Get all sources accessible in the current context
 */
export function getAccessibleSources(
  sources: Source[],
  context: SourceResolutionContext
): Source[] {
  return sources.filter(source => {
    // User must match
    if (source.userId !== context.userId) return false
    
    // If source is workspace-scoped, workspace must match
    if (source.workspaceId && source.workspaceId !== context.workspaceId) return false
    
    // If source is stack-scoped, stack must match
    if (source.stackId && source.stackId !== context.stackId) return false
    
    return true
  })
}

/**
 * Group sources by scope for display
 */
export function groupSourcesByScope(
  sources: Source[],
  context: SourceResolutionContext
): Record<SourceScope, Source[]> {
  const grouped: Record<SourceScope, Source[]> = {
    user: [],
    workspace: [],
    stack: [],
  }
  
  for (const source of sources) {
    if (source.stackId === context.stackId) {
      grouped.stack.push(source)
    } else if (source.workspaceId === context.workspaceId && !source.stackId) {
      grouped.workspace.push(source)
    } else if (source.userId === context.userId && !source.workspaceId && !source.stackId) {
      grouped.user.push(source)
    }
  }
  
  return grouped
}