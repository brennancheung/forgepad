'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Id } from '@convex/_generated/dataModel'
import { Doc } from '@convex/_generated/dataModel'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuAction,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export function WorkspaceSidebarSection() {
  const workspaces = useQuery(api.workspaces.listWorkspaces)
  const createWorkspace = useMutation(api.workspaces.create)
  const renameWorkspace = useMutation(api.workspaces.renameWorkspace)
  const deleteWorkspace = useMutation(api.workspaces.deleteWorkspace)
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [editingWorkspace, setEditingWorkspace] = useState<Doc<'workspaces'> | null>(null)
  const [renameName, setRenameName] = useState('')
  const [deleteWorkspace_, setDeleteWorkspace] = useState<Doc<'workspaces'> | null>(null)
  
  const router = useRouter()
  const pathname = usePathname()
  
  // Extract workspace ID from pathname if it exists
  const activeWorkspaceId = pathname.match(/\/workspace\/([^/]+)/)?.[1] as Id<'workspaces'> | undefined

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    const id = await createWorkspace({ name: newWorkspaceName || undefined })
    router.push(`/workspace/${id}`)
    setNewWorkspaceName('')
    setCreateDialogOpen(false)
  }

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingWorkspace && renameName.trim()) {
      await renameWorkspace({
        workspaceId: editingWorkspace._id,
        name: renameName.trim(),
      })
      setEditingWorkspace(null)
      setRenameName('')
    }
  }

  const handleDelete = async () => {
    if (deleteWorkspace_) {
      await deleteWorkspace({ workspaceId: deleteWorkspace_._id })
      if (activeWorkspaceId === deleteWorkspace_._id) {
        router.push('/dashboard')
      }
      setDeleteWorkspace(null)
    }
  }

  return (
    <>
      <SidebarGroup>
        <div className="flex items-center justify-between">
          <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 mr-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <SidebarGroupContent>
          <SidebarMenu>
            {/* Workspace list */}
            {workspaces?.map((workspace) => (
              <SidebarMenuItem
                key={workspace._id}
                className="relative"
              >
                <SidebarMenuButton
                  asChild
                  isActive={activeWorkspaceId === workspace._id}
                  className="group data-[active=true]:font-normal data-[active=true]:bg-slate-200 dark:data-[active=true]:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900"
                >
                  <Link href={`/workspace/${workspace._id}`} className="flex min-w-0 items-center gap-2 pr-8">
                    <span className="truncate flex-1">{workspace.name}</span>
                  </Link>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuAction showOnHover className="right-1">
                      <MoreHorizontal className="h-4 w-4" />
                    </SidebarMenuAction>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-32">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingWorkspace(workspace)
                        setRenameName(workspace.name)
                      }}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteWorkspace(workspace)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Create Workspace Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleCreateWorkspace}>
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
              <DialogDescription>
                Create a new workspace to organize your work. Leave the name empty for an
                auto-generated name.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="col-span-3"
                  placeholder="Optional - leave empty for auto-generated name"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!editingWorkspace} onOpenChange={(open) => !open && setEditingWorkspace(null)}>
        <DialogContent>
          <form onSubmit={handleRename}>
            <DialogHeader>
              <DialogTitle>Rename Workspace</DialogTitle>
              <DialogDescription>
                Enter a new name for your workspace.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rename" className="text-right">
                  Name
                </Label>
                <Input
                  id="rename"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  className="col-span-3"
                  autoFocus
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingWorkspace(null)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteWorkspace_} onOpenChange={(open) => !open && setDeleteWorkspace(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteWorkspace_?.name}&quot;? This will permanently delete
              all stacks and cells within this workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}