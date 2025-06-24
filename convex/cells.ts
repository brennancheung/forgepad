import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'

// Create a new cell
export const create = mutation({
  args: {
    stackId: v.id('stacks'),
    content: v.string(),
    type: v.union(
      v.literal('text'),
      v.literal('prompt'),
      v.literal('response'),
      v.literal('data'),
      v.literal('code'),
      v.literal('widget')
    ),
    name: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal('pending'),
      v.literal('streaming'),
      v.literal('complete'),
      v.literal('error'),
      v.literal('cancelled')
    )),
    metadata: v.optional(v.object({
      prompt: v.optional(v.string()),
      model: v.optional(v.string()),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      startedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      tokenCount: v.optional(v.number()),
      streamedChunks: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    
    if (!user) throw new Error('User not found')

    const stack = await ctx.db.get(args.stackId)
    if (!stack || stack.userId !== user._id) {
      throw new Error('Stack not found or unauthorized')
    }

    // Calculate stack position by counting existing cells
    const existingCells = await ctx.db
      .query('cells')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    const stackPosition = existingCells.length

    const now = Date.now()
    
    // Create the cell
    const cellId = await ctx.db.insert('cells', {
      stackId: args.stackId,
      stackPosition,
      content: args.content,
      type: args.type,
      name: args.name,
      status: args.status || 'complete',
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    })

    // Update stack timestamp
    await ctx.db.patch(args.stackId, {
      updatedAt: now,
    })

    // Update workspace timestamp
    await ctx.db.patch(stack.workspaceId, {
      updatedAt: now,
    })

    return cellId
  },
})

// Create cell from server (for AI actions)
export const createFromServer = mutation({
  args: {
    stackId: v.id('stacks'),
    content: v.string(),
    type: v.union(
      v.literal('text'),
      v.literal('prompt'),
      v.literal('response'),
      v.literal('data'),
      v.literal('code'),
      v.literal('widget')
    ),
    status: v.union(
      v.literal('pending'),
      v.literal('streaming'),
      v.literal('complete'),
      v.literal('error'),
      v.literal('cancelled')
    ),
    metadata: v.optional(v.object({
      prompt: v.optional(v.string()),
      model: v.optional(v.string()),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      startedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      tokenCount: v.optional(v.number()),
      streamedChunks: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const stack = await ctx.db.get(args.stackId)
    if (!stack) {
      throw new Error('Stack not found')
    }

    // Calculate stack position by counting existing cells
    const existingCells = await ctx.db
      .query('cells')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    const stackPosition = existingCells.length

    const now = Date.now()
    
    // Create the cell
    const cellId = await ctx.db.insert('cells', {
      stackId: args.stackId,
      stackPosition,
      content: args.content,
      type: args.type,
      status: args.status,
      metadata: args.metadata,
      createdAt: now,
      updatedAt: now,
    })

    // Update stack timestamp
    await ctx.db.patch(args.stackId, {
      updatedAt: now,
    })

    // Update workspace timestamp
    await ctx.db.patch(stack.workspaceId, {
      updatedAt: now,
    })

    return cellId
  },
})

// Get a specific cell
export const get = query({
  args: { id: v.id('cells') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    
    if (!user) return null

    const cell = await ctx.db.get(args.id)
    if (!cell) return null

    // Verify user has access to this cell's stack
    const stack = await ctx.db.get(cell.stackId)
    if (!stack || stack.userId !== user._id) {
      return null
    }

    return cell
  },
})

// Update cell status
export const updateStatus = mutation({
  args: {
    cellId: v.id('cells'),
    status: v.union(
      v.literal('pending'),
      v.literal('streaming'),
      v.literal('complete'),
      v.literal('error'),
      v.literal('cancelled')
    ),
  },
  handler: async (ctx, args) => {
    const cell = await ctx.db.get(args.cellId)
    if (!cell) throw new Error('Cell not found')

    await ctx.db.patch(args.cellId, {
      status: args.status,
      updatedAt: Date.now(),
    })

    // Update stack timestamp
    const stack = await ctx.db.get(cell.stackId)
    if (stack) {
      await ctx.db.patch(cell.stackId, {
        updatedAt: Date.now(),
      })
      
      // Update workspace timestamp
      await ctx.db.patch(stack.workspaceId, {
        updatedAt: Date.now(),
      })
    }
  },
})

// Update cell content during streaming
export const updateContent = mutation({
  args: {
    cellId: v.id('cells'),
    content: v.string(),
    streamedChunks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cell = await ctx.db.get(args.cellId)
    if (!cell) throw new Error('Cell not found')

    const updates: any = {
      content: args.content,
      updatedAt: Date.now(),
    }

    if (args.streamedChunks !== undefined && cell.metadata) {
      updates.metadata = {
        ...cell.metadata,
        streamedChunks: args.streamedChunks,
      }
    }

    await ctx.db.patch(args.cellId, updates)
  },
})

// Finalize a cell after streaming completes
export const finalize = mutation({
  args: {
    cellId: v.id('cells'),
    content: v.string(),
    status: v.union(
      v.literal('complete'),
      v.literal('error'),
      v.literal('cancelled')
    ),
    metadata: v.optional(v.object({
      completedAt: v.optional(v.number()),
      tokenCount: v.optional(v.number()),
      streamedChunks: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const cell = await ctx.db.get(args.cellId)
    if (!cell) throw new Error('Cell not found')

    const updatedMetadata = cell.metadata ? {
      ...cell.metadata,
      ...args.metadata,
    } : args.metadata

    await ctx.db.patch(args.cellId, {
      content: args.content,
      status: args.status,
      metadata: updatedMetadata,
      updatedAt: Date.now(),
    })

    // Update stack and workspace timestamps
    const stack = await ctx.db.get(cell.stackId)
    if (stack) {
      await ctx.db.patch(cell.stackId, {
        updatedAt: Date.now(),
      })
      
      await ctx.db.patch(stack.workspaceId, {
        updatedAt: Date.now(),
      })
    }
  },
})

// Set error state
export const setError = mutation({
  args: {
    cellId: v.id('cells'),
    error: v.string(),
    status: v.union(
      v.literal('error'),
      v.literal('cancelled')
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.cellId, {
      error: args.error,
      status: args.status,
      updatedAt: Date.now(),
    })
  },
})

// List cells for a stack
export const listByStack = query({
  args: { stackId: v.id('stacks') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    
    if (!user) return []

    const stack = await ctx.db.get(args.stackId)
    if (!stack || stack.userId !== user._id) {
      return []
    }

    const cells = await ctx.db
      .query('cells')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()

    return cells.sort((a, b) => a.stackPosition - b.stackPosition)
  },
})


// Get the top cell of a stack (highest stackPosition)
export const getTopCell = query({
  args: { stackId: v.id('stacks') },
  handler: async (ctx, args) => {
    const cells = await ctx.db
      .query('cells')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    
    if (cells.length === 0) return null
    
    // Find the cell with the highest stackPosition
    return cells.reduce((top, cell) => 
      cell.stackPosition > top.stackPosition ? cell : top
    )
  },
})

// Get multiple top cells from a stack
export const getTopCells = query({
  args: { 
    stackId: v.id('stacks'),
    count: v.number()
  },
  handler: async (ctx, args) => {
    const cells = await ctx.db
      .query('cells')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    
    // Sort by stackPosition descending and take the top N
    return cells
      .sort((a, b) => b.stackPosition - a.stackPosition)
      .slice(0, args.count)
  },
})

// Delete a cell
export const deleteCell = mutation({
  args: {
    cellId: v.id('cells'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    
    if (!user) throw new Error('User not found')

    const cell = await ctx.db.get(args.cellId)
    if (!cell) throw new Error('Cell not found')

    const stack = await ctx.db.get(cell.stackId)
    if (!stack || stack.userId !== user._id) {
      throw new Error('Unauthorized')
    }

    // Delete the cell
    await ctx.db.delete(args.cellId)

    // Update remaining cells' positions
    const remainingCells = await ctx.db
      .query('cells')
      .withIndex('by_stack', (q) => q.eq('stackId', cell.stackId))
      .collect()
    
    // Renumber cells with positions greater than the deleted cell
    for (const remainingCell of remainingCells) {
      if (remainingCell.stackPosition > cell.stackPosition) {
        await ctx.db.patch(remainingCell._id, {
          stackPosition: remainingCell.stackPosition - 1,
        })
      }
    }

    // Update stack timestamp
    await ctx.db.patch(cell.stackId, {
      updatedAt: Date.now(),
    })

    // Update workspace timestamp
    await ctx.db.patch(stack.workspaceId, {
      updatedAt: Date.now(),
    })
  },
})