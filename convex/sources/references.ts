import { v } from 'convex/values'
import { mutation, query } from '../_generated/server'

// Simple regex to find source references in text
const SOURCE_REFERENCE_REGEX = /\{\{(source|user|workspace|stack):([a-zA-Z0-9_\-\.]+)(\[[0-9]+\]|\.[a-zA-Z0-9_]+)*\}\}/g

function parseSourceReferences(text: string) {
  const references = []
  let match
  
  SOURCE_REFERENCE_REGEX.lastIndex = 0
  while ((match = SOURCE_REFERENCE_REGEX.exec(text)) !== null) {
    references.push({
      type: match[1],
      name: match[2],
      path: match[3] || undefined,
    })
  }
  
  return references
}

// Update cell source references
export const updateCellSourceReferences = mutation({
  args: {
    cellId: v.id('cells'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Not authenticated')

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) throw new Error('User not found')

    // Get the cell to verify ownership
    const cell = await ctx.db.get(args.cellId)
    if (!cell) throw new Error('Cell not found')

    // Verify the cell belongs to a stack owned by the user
    const stack = await ctx.db.get(cell.stackId)
    if (!stack || stack.userId !== user._id) {
      throw new Error('Unauthorized')
    }

    // Parse source references from content
    const references = parseSourceReferences(args.content)
    const sourceNames = [...new Set(references.map(ref => ref.name))]

    // For now, just update the cell's updatedAt timestamp
    // TODO: Add referencedSources to cell metadata schema
    await ctx.db.patch(args.cellId, {
      updatedAt: Date.now(),
    })

    return { sourceNames }
  },
})

// Get cells that reference a specific source
export const getCellsReferencingSource = query({
  args: {
    sourceId: v.id('sources'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) return []

    // Get the source
    const source = await ctx.db.get(args.sourceId)
    if (!source || source.userId !== user._id) return []

    // Get all user's stacks
    const userStacks = await ctx.db
      .query('stacks')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()
    
    const stackIds = userStacks.map(s => s._id)

    // Find cells that reference this source
    const cells = await ctx.db
      .query('cells')
      .filter((q) => 
        q.or(
          ...stackIds.map(stackId => q.eq(q.field('stackId'), stackId))
        )
      )
      .collect()

    // Filter cells that contain references to this source
    const searchPatterns = [
      `{{source:${source.name}}}`,
      `{{source:#${args.sourceId}}}`,
      `{{user:${source.name}}}`,
      `{{workspace:${source.name}}}`,
      `{{stack:${source.name}}}`,
    ]

    return cells.filter(cell => 
      searchPatterns.some(pattern => cell.content.includes(pattern))
    )
  },
})

// Validate that a source can be safely deleted
export const validateSourceDeletion = query({
  args: {
    sourceId: v.id('sources'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return { canDelete: false, reason: 'Not authenticated' }
    }

    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    if (!user) {
      return { canDelete: false, reason: 'User not found' }
    }

    // Get the source
    const source = await ctx.db.get(args.sourceId)
    if (!source || source.userId !== user._id) {
      return { canDelete: false, reason: 'Source not found' }
    }

    // Get all user's stacks
    const userStacks = await ctx.db
      .query('stacks')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .collect()
    
    const stackIds = userStacks.map(s => s._id)

    // Find cells that reference this source
    const cells = await ctx.db
      .query('cells')
      .filter((q) => 
        q.or(
          ...stackIds.map(stackId => q.eq(q.field('stackId'), stackId))
        )
      )
      .collect()

    // Filter cells that contain references to this source
    const searchPatterns = [
      `{{source:${source.name}}}`,
      `{{source:#${args.sourceId}}}`,
      `{{user:${source.name}}}`,
      `{{workspace:${source.name}}}`,
      `{{stack:${source.name}}}`,
    ]

    const referencingCells = cells.filter(cell => 
      searchPatterns.some(pattern => cell.content.includes(pattern))
    )
    
    if (referencingCells.length > 0) {
      return {
        canDelete: false,
        reason: `Source is referenced by ${referencingCells.length} cell(s)`,
        referencingCells: referencingCells.map((cell: { _id: string; stackId: string; content: string }) => ({
          id: cell._id,
          stackId: cell.stackId,
          content: cell.content.substring(0, 100) + '...',
        })),
      }
    }

    return { canDelete: true }
  },
})