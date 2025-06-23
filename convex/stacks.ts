import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { Doc, Id } from './_generated/dataModel'

// List stacks for a workspace
export const listByWorkspace = query({
  args: { workspaceId: v.id('workspaces') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    
    if (!user) return []

    const workspace = await ctx.db.get(args.workspaceId)
    if (!workspace || workspace.userId !== user._id) {
      return []
    }

    const stacks = await ctx.db
      .query('stacks')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
      .collect()

    // Get cell counts for each stack
    const stacksWithCounts = await Promise.all(
      stacks.map(async (stack) => {
        const cells = await ctx.db
          .query('cells')
          .withIndex('by_stack', (q) => q.eq('stackId', stack._id))
          .collect()
        
        return {
          ...stack,
          cellCount: cells.length
        }
      })
    )

    return stacksWithCounts.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  },
})

// Get a specific stack
export const get = query({
  args: { id: v.id('stacks') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    
    if (!user) return null

    const stack = await ctx.db.get(args.id)
    if (!stack || stack.userId !== user._id) {
      return null
    }

    return stack
  },
})

// Create a new stack
export const create = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    
    if (!user) throw new Error('User not found')

    const workspace = await ctx.db.get(args.workspaceId)
    if (!workspace || workspace.userId !== user._id) {
      throw new Error('Workspace not found or unauthorized')
    }

    // Get highest order number
    const stacks = await ctx.db
      .query('stacks')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
      .collect()
    
    const maxOrder = stacks.reduce((max, s) => 
      Math.max(max, s.order ?? 0), 0
    )

    const now = Date.now()
    
    const stackId = await ctx.db.insert('stacks', {
      name: args.name,
      workspaceId: args.workspaceId,
      userId: user._id,
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    })

    // Update workspace timestamp
    await ctx.db.patch(args.workspaceId, {
      updatedAt: now,
    })

    return stackId
  },
})

// Rename a stack
export const rename = mutation({
  args: {
    stackId: v.id('stacks'),
    name: v.string(),
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

    const now = Date.now()
    
    await ctx.db.patch(args.stackId, {
      name: args.name,
      updatedAt: now,
    })

    // Update workspace timestamp
    await ctx.db.patch(stack.workspaceId, {
      updatedAt: now,
    })
  },
})

// Delete a stack
export const deleteStack = mutation({
  args: {
    stackId: v.id('stacks'),
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

    // Check if this is the last stack in the workspace
    const stackCount = await ctx.db
      .query('stacks')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', stack.workspaceId))
      .collect()
    
    if (stackCount.length <= 1) {
      throw new Error('Cannot delete the last stack in a workspace')
    }

    // Delete all cells in this stack
    const cells = await ctx.db
      .query('cells')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    
    for (const cell of cells) {
      await ctx.db.delete(cell._id)
    }

    // Delete all operations for this stack
    const operations = await ctx.db
      .query('operations')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    
    for (const operation of operations) {
      await ctx.db.delete(operation._id)
    }

    const now = Date.now()
    
    // Update workspace timestamp
    await ctx.db.patch(stack.workspaceId, {
      updatedAt: now,
    })

    // Delete the stack
    await ctx.db.delete(args.stackId)
  },
})

// Push a cell to a stack (deprecated - cells are now created directly with stackPosition)
export const pushCell = mutation({
  args: {
    stackId: v.id('stacks'),
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

    const stack = await ctx.db.get(args.stackId)
    if (!stack || stack.userId !== user._id) {
      throw new Error('Stack not found or unauthorized')
    }

    const now = Date.now()
    
    // Update stack timestamp
    await ctx.db.patch(args.stackId, {
      updatedAt: now,
    })

    // Update workspace timestamp
    await ctx.db.patch(stack.workspaceId, {
      updatedAt: now,
    })
  },
})

// Pop a cell from a stack
export const popCell = mutation({
  args: {
    stackId: v.id('stacks'),
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

    // Find the cell with the highest stackPosition
    const cells = await ctx.db
      .query('cells')
      .withIndex('by_stack', (q) => q.eq('stackId', args.stackId))
      .collect()
    
    if (cells.length === 0) {
      throw new Error('Stack is empty')
    }

    // Find the cell with the highest stackPosition
    const topCell = cells.reduce((top, cell) => 
      cell.stackPosition > top.stackPosition ? cell : top
    )

    const now = Date.now()
    
    // Update stack timestamp
    await ctx.db.patch(args.stackId, {
      updatedAt: now,
    })

    // Update workspace timestamp
    await ctx.db.patch(stack.workspaceId, {
      updatedAt: now,
    })

    // Delete the cell
    await ctx.db.delete(topCell._id)

    return topCell._id
  },
})