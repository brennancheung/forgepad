import { v } from 'convex/values'
import { mutation } from '../_generated/server'
import { 
  validateSourceValue, 
  validateSourceScope, 
  validateSourceName,
  getSourceValueError 
} from './validation'

// Create a new source
export const createSource = mutation({
  args: {
    workspaceId: v.optional(v.id('workspaces')),
    stackId: v.optional(v.id('stacks')),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal('string'), v.literal('array'), v.literal('json')),
    value: v.any(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) throw new Error('User not found')
    
    // Validate scope
    if (!validateSourceScope(user._id, args.workspaceId, args.stackId)) {
      throw new Error('Invalid source scope: stackId requires workspaceId')
    }
    
    // Validate name
    if (!validateSourceName(args.name)) {
      throw new Error('Invalid source name. Use only alphanumeric, dash, underscore, and dots')
    }
    
    // Validate value matches type
    const valueError = getSourceValueError(args.type, args.value)
    if (valueError) {
      throw new Error(valueError)
    }
    
    // Check for name conflicts at the same scope level
    let existingSource
    if (args.stackId) {
      existingSource = await ctx.db
        .query('sources')
        .filter((q) => 
          q.and(
            q.eq(q.field('stackId'), args.stackId),
            q.eq(q.field('name'), args.name)
          )
        )
        .first()
    } else if (args.workspaceId) {
      existingSource = await ctx.db
        .query('sources')
        .filter((q) => 
          q.and(
            q.eq(q.field('workspaceId'), args.workspaceId),
            q.eq(q.field('stackId'), undefined),
            q.eq(q.field('name'), args.name)
          )
        )
        .first()
    } else {
      existingSource = await ctx.db
        .query('sources')
        .withIndex('by_user_name', (q) => q.eq('userId', user._id).eq('name', args.name))
        .filter((q) => q.eq(q.field('workspaceId'), undefined))
        .first()
    }
    
    if (existingSource) {
      throw new Error(`Source with name "${args.name}" already exists at this scope`)
    }
    
    const now = Date.now()
    
    return await ctx.db.insert('sources', {
      userId: user._id,
      workspaceId: args.workspaceId,
      stackId: args.stackId,
      name: args.name,
      description: args.description,
      type: args.type,
      value: args.value,
      tags: args.tags,
      createdAt: now,
      updatedAt: now,
    })
  },
})

// Update an existing source
export const updateSource = mutation({
  args: {
    id: v.id('sources'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    value: v.optional(v.any()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id)
    if (!source) {
      throw new Error('Source not found')
    }
    
    const updates: Partial<{
      name: string
      description?: string
      value: unknown
      tags?: string[]
      updatedAt: number
    }> = {
      updatedAt: Date.now(),
    }
    
    // Validate and update name if provided
    if (args.name !== undefined) {
      if (!validateSourceName(args.name)) {
        throw new Error('Invalid source name. Use only alphanumeric, dash, underscore, and dots')
      }
      
      // Check for name conflicts at the same scope level
      let existingSource
      if (source.stackId) {
        // For stack-scoped sources, search by name and filter
        existingSource = await ctx.db
          .query('sources')
          .filter((q) => 
            q.and(
              q.eq(q.field('stackId'), source.stackId),
              q.eq(q.field('name'), args.name),
              q.neq(q.field('_id'), args.id)
            )
          )
          .first()
      } else if (source.workspaceId) {
        // For workspace-scoped sources
        existingSource = await ctx.db
          .query('sources')
          .filter((q) => 
            q.and(
              q.eq(q.field('workspaceId'), source.workspaceId),
              q.eq(q.field('stackId'), undefined),
              q.eq(q.field('name'), args.name),
              q.neq(q.field('_id'), args.id)
            )
          )
          .first()
      } else {
        // For user-scoped sources  
        existingSource = await ctx.db
          .query('sources')
          .withIndex('by_user_name', (q) => q.eq('userId', source.userId).eq('name', args.name!))
          .filter((q) => 
            q.and(
              q.eq(q.field('workspaceId'), undefined),
              q.neq(q.field('_id'), args.id)
            )
          )
          .first()
      }
      
      if (existingSource) {
        throw new Error(`Source with name "${args.name}" already exists at this scope`)
      }
      
      updates.name = args.name
    }
    
    // Update description if provided
    if (args.description !== undefined) {
      updates.description = args.description
    }
    
    // Validate and update value if provided
    if (args.value !== undefined) {
      const valueError = getSourceValueError(source.type, args.value)
      if (valueError) {
        throw new Error(valueError)
      }
      updates.value = args.value
    }
    
    // Update tags if provided
    if (args.tags !== undefined) {
      updates.tags = args.tags
    }
    
    await ctx.db.patch(args.id, updates)
    return args.id
  },
})

// Delete a source
export const deleteSource = mutation({
  args: { id: v.id('sources') },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id)
    if (!source) {
      throw new Error('Source not found')
    }
    
    // Check for references in cells
    const searchPatterns = [
      `{{source:${source.name}}}`,
      `{{source:#${args.id}}}`,
    ]
    
    const cells = await ctx.db.query('cells').collect()
    const referencingCells = cells.filter(cell => {
      return searchPatterns.some(pattern => cell.content.includes(pattern))
    })
    
    if (referencingCells.length > 0) {
      throw new Error(`Cannot delete source: ${referencingCells.length} cells reference this source`)
    }
    
    await ctx.db.delete(args.id)
    return { deleted: true }
  },
})

// Duplicate a source
export const duplicateSource = mutation({
  args: {
    sourceId: v.id('sources'),
    newName: v.string(),
    newWorkspaceId: v.optional(v.id('workspaces')),
    newStackId: v.optional(v.id('stacks')),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.sourceId)
    if (!source) {
      throw new Error('Source not found')
    }
    
    // Use the same userId as the original
    const userId = source.userId
    
    // Validate new scope
    if (!validateSourceScope(userId, args.newWorkspaceId, args.newStackId)) {
      throw new Error('Invalid target scope: stackId requires workspaceId')
    }
    
    // Create the duplicate using mutation handler directly
    const now = Date.now()
    
    return await ctx.db.insert('sources', {
      userId,
      workspaceId: args.newWorkspaceId,
      stackId: args.newStackId,
      name: args.newName,
      description: source.description ? `Copy of ${source.description}` : `Copy of ${source.name}`,
      type: source.type,
      value: source.value,
      tags: source.tags,
      createdAt: now,
      updatedAt: now,
    })
  },
})

// Move a source to a different scope
export const moveSource = mutation({
  args: {
    id: v.id('sources'),
    newWorkspaceId: v.optional(v.id('workspaces')),
    newStackId: v.optional(v.id('stacks')),
  },
  handler: async (ctx, args) => {
    const source = await ctx.db.get(args.id)
    if (!source) {
      throw new Error('Source not found')
    }
    
    // Validate new scope
    if (!validateSourceScope(source.userId, args.newWorkspaceId, args.newStackId)) {
      throw new Error('Invalid target scope: stackId requires workspaceId')
    }
    
    // Check for name conflicts at the new scope
    let existingSource
    if (args.newStackId) {
      existingSource = await ctx.db
        .query('sources')
        .filter((q) => 
          q.and(
            q.eq(q.field('stackId'), args.newStackId),
            q.eq(q.field('name'), source.name)
          )
        )
        .first()
    } else if (args.newWorkspaceId) {
      existingSource = await ctx.db
        .query('sources')
        .filter((q) => 
          q.and(
            q.eq(q.field('workspaceId'), args.newWorkspaceId),
            q.eq(q.field('stackId'), undefined),
            q.eq(q.field('name'), source.name)
          )
        )
        .first()
    } else {
      existingSource = await ctx.db
        .query('sources')
        .withIndex('by_user_name', (q) => q.eq('userId', source.userId).eq('name', source.name))
        .filter((q) => q.eq(q.field('workspaceId'), undefined))
        .first()
    }
    
    if (existingSource) {
      throw new Error(`Source with name "${source.name}" already exists at the target scope`)
    }
    
    // Update the source
    await ctx.db.patch(args.id, {
      workspaceId: args.newWorkspaceId,
      stackId: args.newStackId,
      updatedAt: Date.now(),
    })
    
    return args.id
  },
})