'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { StackView } from '@/components/stack/StackView'
import { SourcesPanelDictionary } from '@/components/SourcesPanelDictionary'

const WORKSPACE_NAME = 'Combinatoric Chat'
const STACK_NAME = 'Chat Stack'

export default function CombinatricChatPage() {
  const [isInitialized, setIsInitialized] = useState(false)
  
  // Get current user
  const currentUser = useQuery(api.users.getCurrentUser)
  
  // Query for existing workspace
  const existingWorkspace = useQuery(
    api.workspaces.getByName,
    currentUser ? { name: WORKSPACE_NAME } : 'skip'
  )
  
  // Mutations
  const createWorkspace = useMutation(api.workspaces.create)
  const createStack = useMutation(api.stacks.create)
  
  // Get stacks for the workspace
  const stacks = useQuery(
    api.stacks.listByWorkspace,
    existingWorkspace ? { workspaceId: existingWorkspace._id } : 'skip'
  )

  useEffect(() => {
    async function initialize() {
      if (!currentUser || isInitialized) return
      
      // Check if we need to create workspace
      if (existingWorkspace === undefined) return // Still loading
      
      try {
        if (!existingWorkspace) {
          // Create workspace
          await createWorkspace({ name: WORKSPACE_NAME })
        } else if (stacks !== undefined) {
          // Workspace exists, check if we need to create stack
          if (stacks.length === 0) {
            // Create stack
            await createStack({
              workspaceId: existingWorkspace._id,
              name: STACK_NAME
            })
          }
          setIsInitialized(true)
        }
      } catch (error) {
        console.error('Error initializing workspace and stack:', error)
      }
    }

    initialize()
  }, [currentUser, existingWorkspace, stacks, isInitialized, createWorkspace, createStack])

  // Determine the stack to use
  const currentStack = stacks?.[0]

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading user...</p>
      </div>
    )
  }

  if (!existingWorkspace || !stacks || !currentStack) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Setting up workspace...</p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      <div className="flex-1">
        <StackView 
          stackId={currentStack._id} 
          stackName={STACK_NAME}
          cellCount={currentStack.cellCount}
        />
      </div>
      <div className="w-96 border-l pl-4">
        <SourcesPanelDictionary
          scope="stack"
          workspaceId={existingWorkspace._id}
          stackId={currentStack._id}
          className="h-full overflow-auto"
        />
      </div>
    </div>
  )
}