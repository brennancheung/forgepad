'use client'

import { useMemo } from 'react'
import { generateCombinations, countCombinations, type SourceValue } from '@/lib/combinatorics'
import { cn } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

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
  const { combinations, totalCount } = useMemo(() => {
    const count = countCombinations(sources)
    
    // Don't generate if too many combinations
    if (count > maxCombinations) {
      return { combinations: [], totalCount: count }
    }
    
    return { 
      combinations: generateCombinations(sources), 
      totalCount: count 
    }
  }, [sources, maxCombinations])

  if (totalCount === 0) {
    return (
      <div className={cn("p-4 text-sm text-muted-foreground", className)}>
        No valid combinations. Add string or array sources to generate combinations.
      </div>
    )
  }

  if (totalCount > maxCombinations) {
    return (
      <div className={cn("p-4", className)}>
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500">
          <AlertCircle className="h-4 w-4" />
          <span>Too many combinations ({totalCount.toLocaleString()})</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Maximum {maxCombinations.toLocaleString()} combinations allowed
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="sticky top-0 bg-background p-2 border-b">
        <h3 className="text-sm font-medium">
          Combinations ({totalCount})
        </h3>
      </div>
      
      <div className="space-y-1 p-2">
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