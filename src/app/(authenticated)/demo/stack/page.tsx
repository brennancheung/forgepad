"use client"

import { useState, useEffect } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { StackView } from "@/components/stack/StackView"
import { StackList } from "@/components/stack/StackList"
import { Id } from "@convex/_generated/dataModel"

type StackWithCount = {
  _id: Id<"stacks">
  _creationTime: number
  name: string
  workspaceId: Id<"workspaces">
  userId: Id<"users">
  order?: number
  createdAt: number
  updatedAt: number
  cellCount: number
}

export default function StackDemo() {
  const [selectedStack, setSelectedStack] = useState<Id<"stacks"> | null>(null)

  // Get demo workspace
  const demoWorkspace = useQuery(api.workspaces.getByName, { name: "Demo Workspace" })

  // Create workspace if it doesn't exist
  const createWorkspace = useMutation(api.workspaces.create)
  const createStack = useMutation(api.stacks.create)

  // Get stacks for the workspace
  const stacks = useQuery(api.stacks.listByWorkspace, 
    demoWorkspace ? { workspaceId: demoWorkspace._id } : "skip"
  )

  // Track if we've attempted to create the workspace
  const [hasAttemptedCreate, setHasAttemptedCreate] = useState(false)

  // Initialize demo workspace and stack
  useEffect(() => {
    async function initDemo() {
      // If we already have a workspace, don't create another
      if (demoWorkspace) {
        setHasAttemptedCreate(true)
        return
      }

      // Only create if we've checked and there's no workspace
      // demoWorkspace === null means the query completed but found nothing
      if (demoWorkspace === null && !hasAttemptedCreate) {
        setHasAttemptedCreate(true)
        try {
          console.log("Creating demo workspace...")
          // Create demo workspace
          const workspaceId = await createWorkspace({
            name: "Demo Workspace"
          })

          console.log("Created workspace:", workspaceId)
          // Create initial stack
          const stackId = await createStack({
            workspaceId,
            name: "Main Stack"
          })

          console.log("Created stack:", stackId)
          setSelectedStack(stackId)
        } catch (error) {
          // If the workspace already exists, that's fine - just log it
          if (error instanceof Error && error.message.includes('already exists')) {
            console.log("Demo workspace already exists")
          } else {
            console.error("Failed to initialize demo:", error)
          }
        }
      }
    }

    initDemo()
  }, [demoWorkspace, createWorkspace, createStack, hasAttemptedCreate])

  // Select first stack by default
  useEffect(() => {
    if (stacks && stacks.length > 0 && !selectedStack) {
      setSelectedStack(stacks[0]._id)
    }
  }, [stacks, selectedStack])

  // Debug logging
  console.log("Demo state:", {
    demoWorkspace,
    demoWorkspaceLoading: demoWorkspace === undefined,
    stacks: stacks?.length,
    selectedStack
  })

  // Show loading only during initial load, not when waiting for workspace creation
  const isInitializing = demoWorkspace === undefined || (demoWorkspace && (stacks === undefined || (!selectedStack && stacks?.length > 0)))
  
  if (isInitializing) {
    return (
      <div className="container mx-auto max-w-6xl p-4">
        <Card className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing demo workspace...</p>
          <p className="text-xs text-muted-foreground mt-2">
            {demoWorkspace === undefined && "Checking for existing workspace..."}
            {demoWorkspace && stacks === undefined && "Loading stacks..."}
            {demoWorkspace && stacks && !selectedStack && "Selecting stack..."}
          </p>
        </Card>
      </div>
    )
  }
  
  // If we don't have a workspace yet and we've attempted to create one, show a message
  if (!demoWorkspace && hasAttemptedCreate) {
    return (
      <div className="container mx-auto max-w-6xl p-4">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Failed to create demo workspace. Please check the console for errors.
          </p>
        </Card>
      </div>
    )
  }
  
  // If we have a workspace but no stacks yet, wait a moment for them to be created
  if (demoWorkspace && (!stacks || stacks.length === 0)) {
    return (
      <div className="container mx-auto max-w-6xl p-4">
        <Card className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Setting up workspace...</p>
        </Card>
      </div>
    )
  }
  
  // Safety check - ensure we have all required data
  if (!demoWorkspace || !stacks) {
    return (
      <div className="container mx-auto max-w-6xl p-4">
        <Card className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </Card>
      </div>
    )
  }

  const currentStack = stacks.find(s => s._id === selectedStack)

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]"> {/* Account for header and padding */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Stack + AI Streaming Demo</h1>
        <p className="text-muted-foreground">
          Watch AI responses stream directly into Convex-backed stack cells
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <div className="grid gap-6 lg:grid-cols-[1fr,300px] h-full">
          {/* Main Stack Display */}
          {currentStack && (
            <StackView 
              stackId={currentStack._id}
              stackName={currentStack.name}
              cellCount={(currentStack as StackWithCount).cellCount}
            />
          )}

          {/* Stack List Sidebar */}
          <div className="flex flex-col gap-4 h-full overflow-y-auto">
            <StackList 
              workspaceId={demoWorkspace._id}
              stacks={stacks as StackWithCount[]}
              selectedStackId={selectedStack}
              onStackSelect={setSelectedStack}
            />

            <Card className="p-4 text-sm text-muted-foreground flex-shrink-0">
            <h4 className="font-semibold mb-2">How it works:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Enter a prompt in the input field</li>
              <li>AI response streams into a new cell</li>
              <li>Cell status updates in real-time</li>
              <li>Multiple stacks can be managed</li>
            </ol>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}