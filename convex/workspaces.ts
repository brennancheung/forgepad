import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { Doc } from './_generated/dataModel'

export const listWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    
    if (!user) return []

    const workspaces = await ctx.db
      .query('workspaces')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    // Sort by updatedAt descending (latest first)
    return workspaces.sort((a, b) => b.updatedAt - a.updatedAt)
  },
})

export const get = query({
  args: { id: v.id('workspaces') },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    
    if (!user) return null

    const workspace = await ctx.db.get(args.id)
    if (!workspace || workspace.userId !== user._id) {
      return null
    }

    return workspace
  },
})

export const getByName = query({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    
    if (!user) return null

    const workspace = await ctx.db
      .query('workspaces')
      .withIndex('by_user_and_name', (q) => 
        q.eq('userId', user._id).eq('name', args.name)
      )
      .unique()

    return workspace
  },
})

export const create = mutation({
  args: {
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    
    if (!user) throw new Error('User not found')

    // Generate name if not provided
    let name = args.name
    if (!name) {
      const existingCount = await ctx.db
        .query('workspaces')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .collect()
      name = `Workspace ${existingCount.length + 1}`
    }

    // Check if name already exists
    const existing = await ctx.db
      .query('workspaces')
      .withIndex('by_user_and_name', (q) => 
        q.eq('userId', user._id).eq('name', name)
      )
      .unique()
    
    if (existing) {
      throw new Error('Workspace with this name already exists')
    }

    const now = Date.now()
    
    const workspaceId = await ctx.db.insert('workspaces', {
      name,
      userId: user._id,
      createdAt: now,
      updatedAt: now,
    })
    
    // Create a default stack for the workspace
    await ctx.db.insert('stacks', {
      name: 'Main',
      workspaceId,
      userId: user._id,
      cells: [],
      order: 0,
      createdAt: now,
      updatedAt: now,
    })

    return workspaceId
  },
})

export const renameWorkspace = mutation({
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
      throw new Error('Workspace not found')
    }

    // Check if new name already exists
    const existing = await ctx.db
      .query('workspaces')
      .withIndex('by_user_and_name', (q) => 
        q.eq('userId', user._id).eq('name', args.name)
      )
      .unique()
    
    if (existing && existing._id !== args.workspaceId) {
      throw new Error('Workspace with this name already exists')
    }

    await ctx.db.patch(args.workspaceId, { 
      name: args.name,
      updatedAt: Date.now(),
    })
  },
})

export const deleteWorkspace = mutation({
  args: {
    workspaceId: v.id('workspaces'),
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
      throw new Error('Workspace not found')
    }

    // Check if this is the last workspace
    const workspaceCount = await ctx.db
      .query('workspaces')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()
    
    if (workspaceCount.length <= 1) {
      throw new Error('Cannot delete the last workspace')
    }

    // Delete all stacks in this workspace
    const stacks = await ctx.db
      .query('stacks')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
      .collect()
    
    for (const stack of stacks) {
      // Delete all cells in each stack
      const cells = await ctx.db
        .query('cells')
        .withIndex('by_stack', (q) => q.eq('stackId', stack._id))
        .collect()
      
      for (const cell of cells) {
        await ctx.db.delete(cell._id)
      }
      
      await ctx.db.delete(stack._id)
    }

    // Delete all operations for this workspace
    const operations = await ctx.db
      .query('operations')
      .withIndex('by_workspace', (q) => q.eq('workspaceId', args.workspaceId))
      .collect()
    
    for (const operation of operations) {
      await ctx.db.delete(operation._id)
    }

    await ctx.db.delete(args.workspaceId)
  },
})