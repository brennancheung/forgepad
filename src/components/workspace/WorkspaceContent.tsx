'use client'

import { Doc } from '@convex/_generated/dataModel'

interface WorkspaceContentProps {
  workspace: Doc<'workspaces'> | null
}

export function WorkspaceContent({ workspace }: WorkspaceContentProps) {
  if (!workspace) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Select a workspace to get started</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center">
      <h1 className="text-4xl font-bold">{workspace.name}</h1>
    </div>
  )
}