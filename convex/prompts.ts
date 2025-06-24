import { v } from "convex/values"
import { mutation, query } from "./_generated/server"
import { Doc } from "./_generated/dataModel"

// Schema validators
export const promptValidator = {
  name: v.string(),
  userId: v.string(),
  content: v.string(),
  description: v.string(),
}

// Create a new prompt
export const createPrompt = mutation({
  args: {
    name: v.string(),
    content: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    // Validate name format
    if (!/^[a-zA-Z0-9_]+$/.test(args.name) || args.name.length > 50) {
      throw new Error("Name must be alphanumeric with underscores, max 50 characters")
    }

    // Check for duplicate name
    const existing = await ctx.db
      .query("prompts")
      .withIndex("by_user_name", (q) => 
        q.eq("userId", identity.subject).eq("name", args.name)
      )
      .first()

    if (existing) {
      throw new Error("A prompt with this name already exists")
    }

    const promptId = await ctx.db.insert("prompts", {
      name: args.name,
      userId: identity.subject,
      content: args.content,
      description: args.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return promptId
  },
})

// Update an existing prompt
export const updatePrompt = mutation({
  args: {
    id: v.id("prompts"),
    name: v.string(),
    content: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const prompt = await ctx.db.get(args.id)
    if (!prompt || prompt.userId !== identity.subject) {
      throw new Error("Prompt not found")
    }

    // Validate name format
    if (!/^[a-zA-Z0-9_]+$/.test(args.name) || args.name.length > 50) {
      throw new Error("Name must be alphanumeric with underscores, max 50 characters")
    }

    // Check for duplicate name (excluding current prompt)
    if (args.name !== prompt.name) {
      const existing = await ctx.db
        .query("prompts")
        .withIndex("by_user_name", (q) => 
          q.eq("userId", identity.subject).eq("name", args.name)
        )
        .first()

      if (existing) {
        throw new Error("A prompt with this name already exists")
      }
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      content: args.content,
      description: args.description,
      updatedAt: Date.now(),
    })

    return args.id
  },
})

// Delete a prompt
export const deletePrompt = mutation({
  args: {
    id: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const prompt = await ctx.db.get(args.id)
    if (!prompt || prompt.userId !== identity.subject) {
      throw new Error("Prompt not found")
    }

    await ctx.db.delete(args.id)
  },
})

// List all prompts for the current user
export const listPrompts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    const limit = args.limit ?? 100
    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .order("desc")
      .take(limit)

    return prompts
  },
})

// Get a single prompt
export const getPrompt = query({
  args: {
    id: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }

    const prompt = await ctx.db.get(args.id)
    if (!prompt || prompt.userId !== identity.subject) {
      return null
    }

    return prompt
  },
})

// Search prompts by name or description
export const searchPrompts = query({
  args: {
    searchTerm: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return []
    }

    if (!args.searchTerm) {
      return await ctx.db
        .query("prompts")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .order("desc")
        .take(20)
    }

    // Get all user's prompts and filter in memory
    // (Convex doesn't support text search yet)
    const allPrompts = await ctx.db
      .query("prompts")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect()

    const searchLower = args.searchTerm.toLowerCase()
    const filtered = allPrompts.filter(
      (prompt) =>
        prompt.name.toLowerCase().includes(searchLower) ||
        prompt.description.toLowerCase().includes(searchLower)
    )

    return filtered.slice(0, 20)
  },
})

// Duplicate a prompt
export const duplicatePrompt = mutation({
  args: {
    id: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error("Unauthorized")
    }

    const prompt = await ctx.db.get(args.id)
    if (!prompt || prompt.userId !== identity.subject) {
      throw new Error("Prompt not found")
    }

    // Find a unique name
    let newName = `${prompt.name}_copy`
    let counter = 1
    while (true) {
      const existing = await ctx.db
        .query("prompts")
        .withIndex("by_user_name", (q) =>
          q.eq("userId", identity.subject).eq("name", newName)
        )
        .first()
      
      if (!existing) break
      newName = `${prompt.name}_copy_${counter}`
      counter++
    }

    const newId = await ctx.db.insert("prompts", {
      name: newName,
      userId: identity.subject,
      content: prompt.content,
      description: prompt.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    return newId
  },
})