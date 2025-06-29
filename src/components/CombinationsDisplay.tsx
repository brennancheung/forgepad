'use client'

import { useMemo } from 'react'
import { generateCombinations, countCombinations, type SourceValue } from '@/lib/combinatorics'
import { cn } from '@/lib/utils'
import { AlertCircle, Grid } from 'lucide-react'

interface CombinationsDisplayProps {
  sources: SourceValue[]
  className?: string
  maxCombinations?: number
}

export function CombinationsDisplay({ 
  sources, 
  className,
  maxCombinations = 1000 
}: CombinationsDisplayProps) {
  const { combinations, totalCount, hasEmptySources } = useMemo(() => {
    const count = countCombinations(sources)
    
    // Check if we have sources but they're all empty
    const hasEmptySources = sources.length > 0 && count === 0
    
    // Don't generate if too many combinations
    if (count > maxCombinations) {
      return { combinations: [], totalCount: count, hasEmptySources }
    }
    
    return { 
      combinations: generateCombinations(sources), 
      totalCount: count,
      hasEmptySources
    }
  }, [sources, maxCombinations])

  if (totalCount === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-1 px-2">
          <span className="text-sm font-medium">Combinations</span>
          <Grid className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="p-4 text-sm text-muted-foreground text-center">
          {hasEmptySources 
            ? "No combinations available. Add items to your variable lists to generate combinations."
            : "No variable lists found. Create variable lists in the middle panel to generate combinations."
          }
        </div>
      </div>
    )
  }

  if (totalCount > maxCombinations) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-1 px-2">
          <span className="text-sm font-medium">Combinations</span>
          <Grid className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
            <AlertCircle className="h-4 w-4" />
            <span>Too many combinations ({totalCount.toLocaleString()})</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Maximum {maxCombinations.toLocaleString()} combinations allowed
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">Combinations</span>
          <Grid className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-xs text-muted-foreground">
          {totalCount} {totalCount === 1 ? 'combination' : 'combinations'}
        </span>
      </div>
      
      <div className="space-y-1 px-2">
        {combinations.map((combo, index) => (
          <div 
            key={index}
            className="p-2 rounded border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <pre className="text-xs font-mono whitespace-pre-wrap">
              {JSON.stringify(combo, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  )
}