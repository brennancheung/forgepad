import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()

    return user
  },
})

export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        imageUrl: args.imageUrl,
      })
      return existingUser._id
    }

    const userId = await ctx.db.insert('users', args)

    // Create default workspace for new user
    const now = Date.now()
    const workspaceId = await ctx.db.insert('workspaces', {
      name: 'Default Workspace',
      userId,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    })
    
    // Create a default stack in the default workspace
    await ctx.db.insert('stacks', {
      name: 'Main',
      workspaceId,
      userId,
      cells: [],
      order: 0,
      createdAt: now,
      updatedAt: now,
    })

    return userId
  },
})

export const deleteUser = mutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (!user) {
      throw new Error('User not found')
    }

    // Delete all user's workspaces and associated data
    const workspaces = await ctx.db
      .query('workspaces')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    for (const workspace of workspaces) {
      // Delete all stacks in this workspace
      const stacks = await ctx.db
        .query('stacks')
        .withIndex('by_workspace', (q) => q.eq('workspaceId', workspace._id))
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
        .withIndex('by_workspace', (q) => q.eq('workspaceId', workspace._id))
        .collect()
      
      for (const operation of operations) {
        await ctx.db.delete(operation._id)
      }

      await ctx.db.delete(workspace._id)
    }

    await ctx.db.delete(user._id)
  },
})
