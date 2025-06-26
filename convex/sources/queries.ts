import { v } from 'convex/values'
import { query, QueryCtx } from '../_generated/server'
import { SourceScope } from '../types/sources'
import { Id } from '../_generated/dataModel'

// Helper function to list sources
async function listSourcesHelper(
  ctx: QueryCtx,
  args: {
    userId: Id<'users'>
    workspaceId?: Id<'workspaces'>
    stackId?: Id<'stacks'>
    scope?: SourceScope
    type?: 'string' | 'array' | 'json'
    search?: string
  }
) {
  let sources: Array<{
    _id: Id<'sources'>
    _creationTime: number
    userId: Id<'users'>
    workspaceId?: Id<'workspaces'>
    stackId?: Id<'stacks'>
    name: string
    description?: string
    type: 'string' | 'array' | 'json'
    value: unknown
    tags?: string[]
    createdAt: number
    updatedAt: number
  }> = []
  
  // If specific scope is requested, only get those
  if (args.scope) {
    if (args.scope === 'user') {
      sources = await ctx.db
        .query('sources')
        .withIndex('by_user', (q) => q.eq('userId', args.userId))
        .filter((q) => q.eq(q.field('workspaceId'), undefined))
        .collect()
    } else if (args.scope === 'workspace' && args.workspaceId) {
      sources = await ctx.db
        .query('sources')
        .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
        .filter((q) => q.eq(q.field('stackId'), undefined))
        .collect()
    } else if (args.scope === 'stack' && args.stackId) {
      sources = await ctx.db
        .query('sources')
        .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
        .collect()
    }
  } else {
    // Get all accessible sources
    const userSources = await ctx.db
      .query('sources')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .filter((q) => q.eq(q.field('workspaceId'), undefined))
      .collect()
    
    sources = [...userSources]
    
    if (args.workspaceId) {
      const workspaceSources = await ctx.db
        .query('sources')
        .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
        .filter((q) => q.eq(q.field('stackId'), undefined))
        .collect()
      sources = [...sources, ...workspaceSources]
    }
    
    if (args.stackId) {
      const stackSources = await ctx.db
        .query('sources')
        .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
        .collect()
      sources = [...sources, ...stackSources]
    }
  }
  
  // Apply filters
  if (args.type) {
    sources = sources.filter(s => s.type === args.type)
  }
  
  if (args.search) {
    const searchLower = args.search.toLowerCase()
    sources = sources.filter(s => 
      s.name.toLowerCase().includes(searchLower) ||
      (s.description && s.description.toLowerCase().includes(searchLower)) ||
      (s.tags && s.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)))
    )
  }
  
  // Sort by updatedAt descending
  sources.sort((a, b) => b.updatedAt - a.updatedAt)
  
  return sources
}

// Get a single source by ID
export const getSource = query({
  args: { id: v.id('sources') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return null

    const source = await ctx.db.get(args.id)
    if (!source || source.userId !== user._id) return null
    
    return source
  },
})

// Get source by name with scope resolution
export const getSourceByName = query({
  args: {
    name: v.string(),
    workspaceId: v.optional(v.id('workspaces')),
    stackId: v.optional(v.id('stacks')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return null
    // Resolution order: stack -> workspace -> user
    if (args.stackId) {
      const stackSource = await ctx.db
        .query('sources')
        .withIndex('by_stack_name', (q) => q.eq('stackId', args.stackId).eq('name', args.name))
        .first()
      if (stackSource) return stackSource
    }
    
    if (args.workspaceId) {
      const workspaceSource = await ctx.db
        .query('sources')
        .withIndex('by_workspace_name', (q) => q.eq('workspaceId', args.workspaceId).eq('name', args.name))
        .first()
      if (workspaceSource) return workspaceSource
    }
    
    // Finally check user-level sources
    const userSource = await ctx.db
      .query('sources')
      .withIndex('by_user_name', (q) => q.eq('userId', user._id).eq('name', args.name))
      .filter((q) => q.eq(q.field('workspaceId'), undefined))
      .first()
    
    return userSource
  },
})

// List all sources accessible in current context
export const listSources = query({
  args: {
    workspaceId: v.optional(v.id('workspaces')),
    stackId: v.optional(v.id('stacks')),
    scope: v.optional(v.union(v.literal('user'), v.literal('workspace'), v.literal('stack'))),
    type: v.optional(v.union(v.literal('string'), v.literal('array'), v.literal('json'))),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return []

    return await listSourcesHelper(ctx, {
      userId: user._id,
      ...args
    })
  },
})

// Search for sources by name/description/tags
export const searchSources = query({
  args: {
    query: v.string(),
    workspaceId: v.optional(v.id('workspaces')),
    stackId: v.optional(v.id('stacks')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return []

    return await listSourcesHelper(ctx, {
      userId: user._id,
      workspaceId: args.workspaceId,
      stackId: args.stackId,
      search: args.query,
    })
  },
})

// Get all sources at user level
export const listUserSources = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return []

    return await listSourcesHelper(ctx, {
      userId: user._id,
      scope: 'user',
    })
  },
})

// Get all sources at workspace level
export const listWorkspaceSources = query({
  args: { 
    workspaceId: v.id('workspaces'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return []

    return await listSourcesHelper(ctx, {
      userId: user._id,
      workspaceId: args.workspaceId,
      scope: 'workspace',
    })
  },
})

// Get all sources at stack level
export const listStackSources = query({
  args: { 
    workspaceId: v.id('workspaces'),
    stackId: v.id('stacks'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return []

    return await listSourcesHelper(ctx, {
      userId: user._id,
      workspaceId: args.workspaceId,
      stackId: args.stackId,
      scope: 'stack',
    })
  },
})

// Find cells that reference a source
export const getSourceReferences = query({
  args: { sourceId: v.id('sources') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return []

    const source = await ctx.db.get(args.sourceId)
    if (!source || source.userId !== user._id) return []
    
    // Search for cells containing references to this source
    // This is a simple implementation - in production you might want to index references
    const searchPatterns = [
      `{{source:${source.name}}}`,
      `{{source:#${args.sourceId}}}`,
      `{{user:${source.name}}}`,
      `{{workspace:${source.name}}}`,
      `{{stack:${source.name}}}`,
    ]
    
    // Only search cells in user's stacks
    const userStacks = await ctx.db
      .query('stacks')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()
    
    const stackIds = userStacks.map(s => s._id)
    const cells = await ctx.db.query('cells').collect()
    
    return cells.filter(cell => {
      return stackIds.includes(cell.stackId) && 
        searchPatterns.some(pattern => cell.content.includes(pattern))
    })
  },
})