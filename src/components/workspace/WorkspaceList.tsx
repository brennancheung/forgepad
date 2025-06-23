'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { Doc } from '@convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { WorkspaceItem } from './WorkspaceItem'
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog'

interface WorkspaceListProps {
  workspaces: Doc<'workspaces'>[]
  activeWorkspaceId: Id<'workspaces'> | null
  onWorkspaceSelect: (workspaceId: Id<'workspaces'>) => void
}

export function WorkspaceList({ workspaces, activeWorkspaceId, onWorkspaceSelect }: WorkspaceListProps) {
  const createWorkspace = useMutation(api.workspaces.create)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleCreateWorkspace = async (name?: string) => {
    const id = await createWorkspace({ name })
    onWorkspaceSelect(id)
    setCreateDialogOpen(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Workspaces</CardTitle>
          <CardDescription>Switch between different contexts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {workspaces.map((workspace) => (
            <WorkspaceItem
              key={workspace._id}
              workspace={workspace}
              isActive={workspace._id === activeWorkspaceId}
              onClick={() => onWorkspaceSelect(workspace._id)}
            />
          ))}
          
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="w-full"
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Workspace
          </Button>
        </CardContent>
      </Card>

      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateWorkspace={handleCreateWorkspace}
      />
    </>
  )
}