'use client'

import { use } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Layers } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function WorkspacePage({ params }: PageProps) {
  const { id } = use(params)
  const workspaceId = id as Id<'workspaces'>
  
  const workspace = useQuery(api.workspaces.get, { id: workspaceId })
  const stacks = useQuery(api.stacks.listByWorkspace, { workspaceId })
  const createStack = useMutation(api.stacks.create)

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <p>Loading workspace...</p>
      </div>
    )
  }

  const handleCreateStack = async () => {
    await createStack({
      workspaceId,
      name: `Stack ${(stacks?.length || 0) + 1}`
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{workspace.name}</h1>
          {workspace.description && (
            <p className="text-muted-foreground mt-1">{workspace.description}</p>
          )}
        </div>
        <Button onClick={handleCreateStack}>
          <Plus className="mr-2 h-4 w-4" />
          New Stack
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stacks?.map((stack) => (
          <Card key={stack._id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  {stack.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {stack.cellCount} cells
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stack.cellCount === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Empty stack. Push content to begin.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Stack operations coming soon...
                </p>
              )}
            </CardContent>
          </Card>
        ))}
        
        {(!stacks || stacks.length === 0) && (
          <Card className="border-dashed">
            <CardContent className="flex items-center justify-center h-full p-6">
              <div className="text-center">
                <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No stacks yet. Create your first stack to get started.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}