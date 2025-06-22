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
    userId: v.id('users'),
    isDefault: v.boolean(),
  })
    .index('by_user', ['userId'])
    .index('by_user_default', ['userId', 'isDefault']),

  stacks: defineTable({
    name: v.string(),
    workspaceId: v.id('workspaces'),
    userId: v.id('users'),
  })
    .index('by_workspace', ['workspaceId'])
    .index('by_user', ['userId']),

  cells: defineTable({
    stackId: v.id('stacks'),
    position: v.number(),
    name: v.optional(v.string()),
    type: v.union(
      v.literal('prompt'),
      v.literal('response'),
      v.literal('data'),
      v.literal('widget')
    ),
    content: v.any(),
    metadata: v.optional(v.any()),
  })
    .index('by_stack', ['stackId'])
    .index('by_stack_position', ['stackId', 'position']),
})
