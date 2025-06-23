'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus } from 'lucide-react'
import { WorkspaceItem } from './WorkspaceItem'
import { CreateWorkspaceDialog } from './CreateWorkspaceDialog'

interface WorkspaceSidebarProps {
  activeWorkspaceId: Id<'workspaces'> | null
  onWorkspaceSelect: (workspaceId: Id<'workspaces'>) => void
}

export function WorkspaceSidebar({ activeWorkspaceId, onWorkspaceSelect }: WorkspaceSidebarProps) {
  const workspaces = useQuery(api.workspaces.listWorkspaces)
  const createWorkspace = useMutation(api.workspaces.create)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const handleCreateWorkspace = async (name?: string) => {
    const id = await createWorkspace({ name })
    onWorkspaceSelect(id)
    setCreateDialogOpen(false)
  }

  if (!workspaces) {
    return (
      <div className="w-64 border-r bg-background p-4">
        <div className="h-8 w-full animate-pulse bg-muted rounded" />
      </div>
    )
  }

  return (
    <div className="w-64 border-r bg-background flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Workspaces</h2>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          {workspaces.map((workspace) => (
            <WorkspaceItem
              key={workspace._id}
              workspace={workspace}
              isActive={workspace._id === activeWorkspaceId}
              onClick={() => onWorkspaceSelect(workspace._id)}
            />
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="w-full"
          variant="outline"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Workspace
        </Button>
      </div>

      <CreateWorkspaceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateWorkspace={handleCreateWorkspace}
      />
    </div>
  )
}