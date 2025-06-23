'use server'

import { ConvexHttpClient } from 'convex/browser'
import { api } from '@convex/_generated/api'
import { streamText, generateObject } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import { Id } from '@convex/_generated/dataModel'

// Create OpenAI provider with explicit API key
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function generateWithAI({
  prompt,
  stackId,
  model = 'gpt-4o',
  temperature = 0.7,
  maxTokens = 2000,
}: {
  prompt: string
  stackId: Id<'stacks'>
  model?: string
  temperature?: number
  maxTokens?: number
}) {
  // Create cell in pending state
  const cellId = await convex.mutation(api.cells.createFromServer, {
    stackId,
    content: '',
    type: 'response',
    status: 'pending',
    metadata: {
      prompt,
      model,
      temperature,
      maxTokens,
      startedAt: Date.now(),
    },
  })

  try {
    // Update to streaming state
    await convex.mutation(api.cells.updateStatus, {
      cellId,
      status: 'streaming',
    })

    // Start streaming with AI SDK v5
    const result = streamText({
      model: openai(model),
      prompt,
    })

    // Process stream with proper debouncing
    let accumulated = ''
    let chunkCount = 0
    let lastUpdateTime = Date.now()
    let pendingUpdate = false

    // Function to update Convex
    const updateConvex = async () => {
      if (accumulated === '') return
      
      try {
        await convex.mutation(api.cells.updateContent, {
          cellId,
          content: accumulated,
          streamedChunks: chunkCount,
        })
        lastUpdateTime = Date.now()
        pendingUpdate = false
      } catch (error) {
        console.error('Failed to update cell content:', error)
      }
    }

    for await (const chunk of result.textStream) {
      accumulated += chunk
      chunkCount++
      
      const now = Date.now()
      const timeSinceLastUpdate = now - lastUpdateTime
      
      // Update if 250ms have passed since last update
      if (timeSinceLastUpdate >= 250) {
        await updateConvex()
      } else {
        // Mark that we have a pending update
        pendingUpdate = true
      }
    }
    
    // Final update if there's pending content
    if (pendingUpdate) {
      await updateConvex()
    }

    // Final update with complete content
    const usage = await result.usage
    await convex.mutation(api.cells.finalize, {
      cellId,
      content: accumulated,
      status: 'complete',
      metadata: {
        completedAt: Date.now(),
        tokenCount: usage?.totalTokens,
        streamedChunks: chunkCount,
      },
    })

    return { cellId, success: true }
  } catch (error) {
    // Error state in database
    await convex.mutation(api.cells.setError, {
      cellId,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error',
    })

    return { cellId, success: false, error }
  }
}

export async function generateStructuredData({
  prompt,
  schema,
  stackId,
  model = 'gpt-4o',
}: {
  prompt: string
  schema: z.ZodSchema
  stackId: Id<'stacks'>
  model?: string
}) {
  const cellId = await convex.mutation(api.cells.createFromServer, {
    stackId,
    content: '',
    type: 'data',
    status: 'pending',
    metadata: {
      model,
      prompt,
      startedAt: Date.now(),
    },
  })

  try {
    await convex.mutation(api.cells.updateStatus, {
      cellId,
      status: 'streaming',
    })

    const result = await generateObject({
      model: openai(model),
      prompt,
      schema,
    })

    await convex.mutation(api.cells.finalize, {
      cellId,
      content: JSON.stringify(result.object, null, 2),
      status: 'complete',
      metadata: {
        completedAt: Date.now(),
      },
    })

    return { cellId, data: result.object, success: true }
  } catch (error) {
    await convex.mutation(api.cells.setError, {
      cellId,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error',
    })

    return { cellId, success: false, error }
  }
}

// Resume a failed generation
export async function resumeGeneration(cellId: Id<'cells'>) {
  const cell = await convex.query(api.cells.get, { id: cellId })

  if (!cell || cell.status !== 'error' || !cell.metadata?.prompt) {
    throw new Error('Cannot resume this cell')
  }

  return generateWithAI({
    prompt: cell.metadata.prompt,
    stackId: cell.stackId,
    model: cell.metadata.model,
    temperature: cell.metadata.temperature,
    maxTokens: cell.metadata.maxTokens,
  })
}

// Stack operation helpers
export async function performStackOperation({
  stackId,
  operation,
  parameters,
}: {
  stackId: Id<'stacks'>
  operation: 'query' | 'expand' | 'filter' | 'merge' | 'summarize' | 'transform'
  parameters: Record<string, unknown>
}) {
  const stack = await convex.query(api.stacks.get, { id: stackId })
  if (!stack) throw new Error('Stack not found')

  switch (operation) {
    case 'query': {
      const topCell = await convex.query(api.cells.getTopCell, { stackId })
      if (!topCell) {
        throw new Error('Stack is empty')
      }

      const prompt = `${parameters.query as string}\n\nContext:\n${topCell.content}`
      return generateWithAI({
        prompt,
        stackId,
      })
    }

    case 'expand': {
      const topCell = await convex.query(api.cells.getTopCell, { stackId })
      if (!topCell) {
        throw new Error('Stack is empty')
      }

      const prompt = `Please expand on the following content with more detail and examples:\n\n${topCell.content}`
      return generateWithAI({
        prompt,
        stackId,
      })
    }

    case 'summarize': {
      const topCell = await convex.query(api.cells.getTopCell, { stackId })
      if (!topCell) {
        throw new Error('Stack is empty')
      }

      const prompt = `Please provide a concise summary of the following content:\n\n${topCell.content}`
      return generateWithAI({
        prompt,
        stackId,
      })
    }

    case 'filter': {
      const topCell = await convex.query(api.cells.getTopCell, { stackId })
      if (!topCell) {
        throw new Error('Stack is empty')
      }

      const prompt = `Extract only the parts related to "${
        parameters.filterQuery as string
      }" from the following content:\n\n${topCell.content}`
      return generateWithAI({
        prompt,
        stackId,
      })
    }

    case 'merge': {
      const count = (parameters.count as number) || 2
      const topCells = await convex.query(api.cells.getTopCells, { stackId, count })

      if (topCells.length < count) {
        throw new Error(`Not enough cells in stack (need ${count}, have ${topCells.length})`)
      }

      const contents = topCells
        .reverse() // Reverse to get chronological order
        .map((cell, i) => `### Section ${i + 1}\n\n${cell.content}`)
        .join('\n\n')

      const prompt = `Please merge and synthesize the following ${count} sections into a cohesive response:\n\n${contents}`
      return generateWithAI({
        prompt,
        stackId,
      })
    }

    default:
      throw new Error(`Unknown operation: ${operation}`)
  }
}
