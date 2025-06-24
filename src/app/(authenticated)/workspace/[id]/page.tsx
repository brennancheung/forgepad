'use client'

import { use, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Layers } from 'lucide-react'
import { StackTabs } from '@/components/stack/StackTabs'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function WorkspacePage({ params }: PageProps) {
  const { id } = use(params)
  const workspaceId = id as Id<'workspaces'>
  
  const workspace = useQuery(api.workspaces.get, { id: workspaceId })
  const stacks = useQuery(api.stacks.listByWorkspace, { workspaceId })
  const createStack = useMutation(api.stacks.create)
  const [selectedStackId, setSelectedStackId] = useState<Id<'stacks'> | null>(null)

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <p>Loading workspace...</p>
      </div>
    )
  }

  const handleCreateStack = async () => {
    const stackId = await createStack({
      workspaceId,
      name: `Stack ${(stacks?.length || 0) + 1}`
    })
    setSelectedStackId(stackId)
  }

  // Auto-select first stack if none selected
  if (stacks && stacks.length > 0 && !selectedStackId) {
    setSelectedStackId(stacks[0]._id)
  }

  // Calculate available height accounting for header and padding
  return (
    <div className="h-[calc(100vh-5.5rem)] -m-6 p-6 flex flex-col">
      {stacks && stacks.length > 0 ? (
        <StackTabs 
          workspaceId={workspaceId}
          stacks={stacks}
          selectedStackId={selectedStackId}
          onStackSelect={setSelectedStackId}
        />
      ) : (
        <Card className="border-dashed m-auto max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground mb-4">
                No stacks yet. Create your first stack to get started.
              </p>
              <Button onClick={handleCreateStack}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Stack
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}