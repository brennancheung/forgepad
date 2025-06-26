'use client'

import { useSourceInterpolation } from '@/hooks/useSourceInterpolation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Id } from '@convex/_generated/dataModel'
import { parseSourceReferences } from '@/lib/sources/interpolation'
import { useMemo } from 'react'

interface InterpolatedCellProps {
  content: string
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
  showReferences?: boolean
}

export function InterpolatedCell({
  content,
  workspaceId,
  stackId,
  showReferences = false,
}: InterpolatedCellProps) {
  const { interpolate, isLoading } = useSourceInterpolation({
    workspaceId,
    stackId,
  })

  const interpolatedContent = useMemo(() => {
    return interpolate(content)
  }, [interpolate, content])

  const references = useMemo(() => {
    return parseSourceReferences(content)
  }, [content])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {showReferences && references.length > 0 && (
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">Source References</CardTitle>
            {references.map((ref, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {ref.type}:{ref.name}
                {ref.path}
              </Badge>
            ))}
          </div>
        </CardHeader>
      )}
      <CardContent className={showReferences && references.length > 0 ? 'pt-3' : 'pt-6'}>
        <div className="whitespace-pre-wrap font-mono text-sm">
          {interpolatedContent}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Preview component that shows both original and interpolated content
 */
export function InterpolationPreview({
  content,
  workspaceId,
  stackId,
}: InterpolatedCellProps) {
  const { interpolate, isLoading } = useSourceInterpolation({
    workspaceId,
    stackId,
  })

  const interpolatedContent = useMemo(() => {
    return interpolate(content)
  }, [interpolate, content])

  const hasReferences = useMemo(() => {
    const references = parseSourceReferences(content)
    return references.length > 0
  }, [content])

  if (!hasReferences) {
    return (
      <div className="whitespace-pre-wrap">{content}</div>
    )
  }

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Original</h4>
        <div className="p-3 bg-muted rounded-md whitespace-pre-wrap font-mono text-sm">
          {content}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2 text-muted-foreground">Interpolated</h4>
        <div className="p-3 bg-muted rounded-md whitespace-pre-wrap font-mono text-sm">
          {interpolatedContent}
        </div>
      </div>
    </div>
  )
}