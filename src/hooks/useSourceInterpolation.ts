'use client'

import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { useMemo } from 'react'
import { interpolateSources, parseSourceReferences } from '@/lib/sources/interpolation'
import { Source } from '@convex/types/sources'

interface UseSourceInterpolationOptions {
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
  enabled?: boolean
}

interface UseSourceInterpolationResult {
  interpolate: (text: string) => string
  isLoading: boolean
  error?: Error
  referencedSources: Set<string>
}

export function useSourceInterpolation({
  workspaceId,
  stackId,
  enabled = true,
}: UseSourceInterpolationOptions): UseSourceInterpolationResult {
  // Fetch sources based on context
  const sources = useQuery(
    api.sources.queries.listSources,
    enabled
      ? {
          workspaceId,
          stackId,
        }
      : 'skip'
  )

  const result = useMemo<UseSourceInterpolationResult>(() => {
    if (!enabled) {
      return {
        interpolate: (text: string) => text,
        isLoading: false,
        referencedSources: new Set(),
      }
    }

    if (sources === undefined) {
      return {
        interpolate: (text: string) => text,
        isLoading: true,
        referencedSources: new Set(),
      }
    }

    // Build a simple source map since we already have filtered sources from the query
    // Cast the sources to the Source type since Convex returns 'unknown' for the value field
    const sourceMap = new Map(
      sources.map((source) => [
        source.name, 
        { ...source, value: source.value as Source['value'] } as Source
      ])
    )

    return {
      interpolate: (text: string) => {
        try {
          return interpolateSources(text, sourceMap)
        } catch (error) {
          console.error('Error interpolating sources:', error)
          return text
        }
      },
      isLoading: false,
      referencedSources: new Set<string>(sourceMap.keys()),
    }
  }, [enabled, sources])

  return result
}

/**
 * Hook to get referenced sources in a text
 */
export function useReferencedSources(text: string) {
  const references = useMemo(() => {
    return parseSourceReferences(text)
  }, [text])

  const sourceNames = useMemo(() => {
    return new Set(references.map(ref => ref.name))
  }, [references])

  return {
    references,
    sourceNames,
  }
}