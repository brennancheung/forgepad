import { Source, SourceScope, SourceResolutionContext, getResolutionOrder } from '@convex/types/sources'

// Try to find source in each scope
const tryScopes = (
  name: string,
  sources: Source[],
  order: SourceScope[],
  context: SourceResolutionContext
): Source | null => {
  for (const scope of order) {
    const source = findSourceInScope(name, sources, scope, context)
    if (source) return source
  }
  return null
}

/**
 * Resolve a source by name following the scope hierarchy
 */
export const resolveSourceByName = (
  name: string,
  sources: Source[],
  context: SourceResolutionContext
): Source | null => {
  const order = getResolutionOrder(context)
  return tryScopes(name, sources, order, context)
}

// Check if source matches stack scope
const isStackScope = (source: Source, context: SourceResolutionContext): boolean =>
  source.stackId === context.stackId

// Check if source matches workspace scope
const isWorkspaceScope = (source: Source, context: SourceResolutionContext): boolean =>
  source.workspaceId === context.workspaceId && !source.stackId

// Check if source matches user scope
const isUserScope = (source: Source, context: SourceResolutionContext): boolean =>
  source.userId === context.userId && !source.workspaceId && !source.stackId

// Get scope matcher function
const getScopeMatcher = (
  scope: SourceScope,
  context: SourceResolutionContext
): ((source: Source) => boolean) => {
  if (scope === 'stack') return (source) => isStackScope(source, context)
  if (scope === 'workspace') return (source) => isWorkspaceScope(source, context)
  if (scope === 'user') return (source) => isUserScope(source, context)
  return () => false
}

/**
 * Find a source in a specific scope
 */
const findSourceInScope = (
  name: string,
  sources: Source[],
  scope: SourceScope,
  context: SourceResolutionContext
): Source | null => {
  const matchesScope = getScopeMatcher(scope, context)
  return sources.find(source => source.name === name && matchesScope(source)) || null
}

/**
 * Resolve a source by explicit scope prefix
 */
export const resolveSourceByPrefix = (
  type: 'source' | 'user' | 'workspace' | 'stack',
  name: string,
  sources: Source[],
  context: SourceResolutionContext
): Source | null => {
  if (type === 'source') return resolveSourceByName(name, sources, context)
  
  const scope = type as SourceScope
  return findSourceInScope(name, sources, scope, context)
}

// Filter sources by scope
const filterByScope = (
  sources: Source[],
  scope: SourceScope,
  context: SourceResolutionContext
): Source[] => {
  const matchesScope = getScopeMatcher(scope, context)
  return sources.filter(matchesScope)
}

// Add sources to map for a given scope
const addSourcesToMap = (
  sourceMap: Map<string, Source>,
  sources: Source[],
  scope: SourceScope,
  context: SourceResolutionContext
): void => {
  const scopeSources = filterByScope(sources, scope, context)
  for (const source of scopeSources) {
    sourceMap.set(source.name, source)
  }
}

/**
 * Build a map of all resolvable sources in the current context
 */
export const buildSourceMap = (
  sources: Source[],
  context: SourceResolutionContext
): Map<string, Source> => {
  const sourceMap = new Map<string, Source>()
  const order = getResolutionOrder(context)
  
  // Add sources in reverse order so higher priority sources override
  for (let i = order.length - 1; i >= 0; i--) {
    addSourcesToMap(sourceMap, sources, order[i], context)
  }
  
  return sourceMap
}

// Check if source is accessible in context
const isAccessible = (source: Source, context: SourceResolutionContext): boolean => {
  if (source.userId !== context.userId) return false
  if (source.workspaceId && source.workspaceId !== context.workspaceId) return false
  if (source.stackId && source.stackId !== context.stackId) return false
  return true
}

/**
 * Get all sources accessible in the current context
 */
export const getAccessibleSources = (
  sources: Source[],
  context: SourceResolutionContext
): Source[] => sources.filter(source => isAccessible(source, context))

// Get the scope of a source in the given context
const getSourceScope = (source: Source, context: SourceResolutionContext): SourceScope | null => {
  if (isStackScope(source, context)) return 'stack'
  if (isWorkspaceScope(source, context)) return 'workspace'
  if (isUserScope(source, context)) return 'user'
  return null
}

/**
 * Group sources by scope for display
 */
export const groupSourcesByScope = (
  sources: Source[],
  context: SourceResolutionContext
): Record<SourceScope, Source[]> => {
  const grouped: Record<SourceScope, Source[]> = {
    user: [],
    workspace: [],
    stack: [],
  }
  
  for (const source of sources) {
    const scope = getSourceScope(source, context)
    if (scope) grouped[scope].push(source)
  }
  
  return grouped
}