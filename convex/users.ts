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
    await ctx.db.insert('workspaces', {
      name: 'Default Workspace',
      userId,
      isDefault: true,
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

    // Delete all user's cells, stacks, and workspaces
    const workspaces = await ctx.db
      .query('workspaces')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()

    for (const workspace of workspaces) {
      const stacks = await ctx.db
        .query('stacks')
        .withIndex('by_workspace', (q) => q.eq('workspaceId', workspace._id))
        .collect()

      for (const stack of stacks) {
        const cells = await ctx.db
          .query('cells')
          .withIndex('by_stack', (q) => q.eq('stackId', stack._id))
          .collect()

        for (const cell of cells) {
          await ctx.db.delete(cell._id)
        }

        await ctx.db.delete(stack._id)
      }

      await ctx.db.delete(workspace._id)
    }

    await ctx.db.delete(user._id)
  },
})
