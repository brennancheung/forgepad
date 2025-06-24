import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  }).index('by_clerk_id', ['clerkId']),

  workspaces: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    userId: v.id('users'),
    settings: v.optional(v.object({
      defaultModel: v.optional(v.string()),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
    })),
    isDefault: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_and_name', ['userId', 'name']),

  stacks: defineTable({
    name: v.string(),
    workspaceId: v.id('workspaces'),
    userId: v.id('users'),
    order: v.optional(v.number()),
    computationalStack: v.optional(
      v.array(
        v.object({
          type: v.union(
            v.literal("number"),
            v.literal("string"),
            v.literal("array"),
            v.literal("boolean"),
            v.literal("cell")
          ),
          value: v.any(),
          ephemeral: v.boolean(),
        })
      )
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_user', ['userId']),

  cells: defineTable({
    stackId: v.id('stacks'),
    stackPosition: v.number(),
    name: v.optional(v.string()),  // for named cells
    content: v.string(),
    type: v.union(
      v.literal('text'),
      v.literal('prompt'),
      v.literal('response'),
      v.literal('data'),
      v.literal('code'),
      v.literal('widget'),
      v.literal('computational')  // for persisted computational values
    ),
    status: v.union(
      v.literal('pending'),
      v.literal('streaming'),
      v.literal('complete'),
      v.literal('error'),
      v.literal('cancelled')
    ),
    error: v.optional(v.string()),
    metadata: v.optional(v.object({
      prompt: v.optional(v.string()),
      model: v.optional(v.string()),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number()),
      startedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      tokenCount: v.optional(v.number()),
      streamedChunks: v.optional(v.number()),
      sourceType: v.optional(v.string()),  // for computational values
      persisted: v.optional(v.boolean()),
      createdAt: v.optional(v.number()),
    })),
    structuredData: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_stack', ['stackId'])
    .index('by_stack_position', ['stackId', 'stackPosition']),

  operations: defineTable({
    workspaceId: v.id('workspaces'),
    stackId: v.id('stacks'),
    type: v.union(
      // Stack operations
      v.literal('push'),
      v.literal('pop'),
      v.literal('duplicate'),
      v.literal('swap'),
      v.literal('rotate'),
      v.literal('copy'),
      v.literal('move'),
      // LLM operations
      v.literal('query'),
      v.literal('expand'),
      v.literal('filter'),
      v.literal('merge'),
      v.literal('summarize'),
      v.literal('transform')
    ),
    inputCells: v.array(v.id('cells')),
    outputCell: v.optional(v.id('cells')),
    targetStackId: v.optional(v.id('stacks')), // for cross-stack operations
    parameters: v.optional(v.record(v.string(), v.any())),
    duration: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_stack', ['stackId']),

  prompts: defineTable({
    name: v.string(),
    userId: v.string(),  // Clerk user ID, not v.id('users')
    content: v.string(),
    description: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_user_name', ['userId', 'name']),
})
