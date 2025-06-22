'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Doc } from '@convex/_generated/dataModel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkspaceItemProps {
  workspace: Doc<'workspaces'>
  isActive: boolean
  onClick: () => void
}

export function WorkspaceItem({ workspace, isActive, onClick }: WorkspaceItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(workspace.name)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  const renameWorkspace = useMutation(api.workspaces.renameWorkspace)
  const deleteWorkspace = useMutation(api.workspaces.deleteWorkspace)

  const handleRename = async () => {
    if (editName.trim() && editName !== workspace.name) {
      try {
        await renameWorkspace({
          workspaceId: workspace._id,
          name: editName.trim(),
        })
      } catch {
        // Reset on error
        setEditName(workspace.name)
      }
    }
    setIsEditing(false)
  }

  const handleDelete = async () => {
    try {
      await deleteWorkspace({ workspaceId: workspace._id })
    } catch (error) {
      console.error('Failed to delete workspace:', error)
    }
    setDeleteDialogOpen(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename()
            if (e.key === 'Escape') {
              setEditName(workspace.name)
              setIsEditing(false)
            }
          }}
          className="h-8"
          autoFocus
        />
      </div>
    )
  }

  return (
    <>
      <div
        className={cn(
          'flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent',
          isActive && 'bg-accent'
        )}
      >
        <button
          onClick={onClick}
          className="flex-1 text-left text-sm font-medium"
        >
          {workspace.name}
        </button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setIsEditing(true)
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setDeleteDialogOpen(true)
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{workspace.name}&quot;? This will permanently delete
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