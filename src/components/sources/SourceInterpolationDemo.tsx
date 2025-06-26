'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useSourceInterpolation } from '@/hooks/useSourceInterpolation'
import { Id } from '@convex/_generated/dataModel'
import { Skeleton } from '@/components/ui/skeleton'

interface SourceInterpolationDemoProps {
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
}

export function SourceInterpolationDemo({ workspaceId, stackId }: SourceInterpolationDemoProps) {
  const [input, setInput] = useState(
    `Welcome {{user:greeting}}!

Today's config: {{workspace:config}}

Items to process:
- {{source:items[0]}}
- {{source:items[1]}}

Theme setting: {{source:config.theme}}`
  )

  const { interpolate, isLoading } = useSourceInterpolation({
    workspaceId,
    stackId,
  })

  const interpolatedText = interpolate(input)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Source Interpolation Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Input (with source references):
            </label>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter text with {{source:name}} references..."
              className="min-h-[150px] font-mono text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Output (interpolated):
            </label>
            {isLoading ? (
              <Skeleton className="h-[150px] w-full" />
            ) : (
              <div className="min-h-[150px] p-3 bg-muted rounded-md font-mono text-sm whitespace-pre-wrap">
                {interpolatedText}
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Available reference formats:</p>
            <ul className="space-y-1 ml-4">
              <li><code className="bg-muted px-1">{'{{source:name}}'}</code> - Reference source in current scope</li>
              <li><code className="bg-muted px-1">{'{{user:name}}'}</code> - Reference user-level source</li>
              <li><code className="bg-muted px-1">{'{{workspace:name}}'}</code> - Reference workspace-level source</li>
              <li><code className="bg-muted px-1">{'{{stack:name}}'}</code> - Reference stack-level source</li>
              <li><code className="bg-muted px-1">{'{{source:array[0]}}'}</code> - Access array element</li>
              <li><code className="bg-muted px-1">{'{{source:object.property}}'}</code> - Access object property</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}