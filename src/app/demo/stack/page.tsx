"use client"

import { useState, useEffect } from "react"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send, Plus } from "lucide-react"
import { StackDisplay } from "@/components/stack/StackDisplay"
import { generateWithAI } from "@/actions/ai"
import { Id } from "@convex/_generated/dataModel"

export default function StackDemo() {
  const { isAuthenticated } = useConvexAuth()
  const [input, setInput] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedStack, setSelectedStack] = useState<Id<"stacks"> | null>(null)

  // Get demo workspace
  const demoWorkspace = useQuery(api.workspaces.getByName, 
    isAuthenticated ? { name: "Demo Workspace" } : "skip"
  )

  // Create workspace if it doesn't exist
  const createWorkspace = useMutation(api.workspaces.create)
  const createStack = useMutation(api.stacks.create)

  // Get stacks for the workspace
  const stacks = useQuery(api.stacks.listByWorkspace, 
    demoWorkspace ? { workspaceId: demoWorkspace._id } : "skip"
  )

  // Initialize demo workspace and stack
  useEffect(() => {
    async function initDemo() {
      if (!isAuthenticated || demoWorkspace !== null) return

      try {
        // Create demo workspace
        const workspaceId = await createWorkspace({
          name: "Demo Workspace"
        })

        // Create initial stack
        const stackId = await createStack({
          workspaceId,
          name: "Main Stack"
        })

        setSelectedStack(stackId)
      } catch (error) {
        console.error("Failed to initialize demo:", error)
      }
    }

    initDemo()
  }, [isAuthenticated, demoWorkspace, createWorkspace, createStack])

  // Select first stack by default
  useEffect(() => {
    if (stacks && stacks.length > 0 && !selectedStack) {
      setSelectedStack(stacks[0]._id)
    }
  }, [stacks, selectedStack])

  const createCell = useMutation(api.cells.create)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !selectedStack || isGenerating) return

    const promptText = input.trim()
    setIsGenerating(true)
    setInput("")

    try {
      // First, create a cell for the user's prompt
      await createCell({
        stackId: selectedStack,
        content: promptText,
        type: "prompt",
        status: "complete"
      })

      // Then generate AI response
      await generateWithAI({
        prompt: promptText,
        stackId: selectedStack,
        model: "gpt-4o-mini"
      })
    } catch (error) {
      console.error("Generation error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-6xl p-4">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground">
            Please sign in to use the stack demo
          </p>
        </Card>
      </div>
    )
  }

  if (!demoWorkspace || !stacks || !selectedStack) {
    return (
      <div className="container mx-auto max-w-6xl p-4">
        <Card className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing demo workspace...</p>
        </Card>
      </div>
    )
  }

  const currentStack = stacks.find(s => s._id === selectedStack)

  return (
    <div className="container mx-auto max-w-6xl p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Stack + AI Streaming Demo</h1>
        <p className="text-muted-foreground">
          Watch AI responses stream directly into Convex-backed stack cells
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,300px] h-[calc(100vh-200px)]">
        {/* Main Stack Display */}
        <div className="flex flex-col gap-4 h-full">
          <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-semibold">
                {currentStack?.name || "Stack"}
              </h2>
              <span className="text-sm text-muted-foreground">
                {currentStack?.cells.length || 0} cells
              </span>
            </div>
            
            <div className="flex-1 min-h-0 overflow-hidden p-4">
              {currentStack && (
                <StackDisplay stackId={currentStack._id} maxHeight="100%" />
              )}
            </div>
          </Card>

          {/* Input Area */}
          <Card className="p-4 flex-shrink-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter a prompt to generate AI response..."
                className="min-h-[100px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.metaKey) {
                    e.preventDefault()
                    handleSubmit(e as React.FormEvent)
                  }
                }}
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Press ⌘+Enter to generate
                </span>
                <Button
                  type="submit"
                  disabled={!input.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Stack List Sidebar */}
        <div className="flex flex-col gap-4 h-full overflow-y-auto">
          <Card className="p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Stacks</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  const stackId = await createStack({
                    workspaceId: demoWorkspace._id,
                    name: `Stack ${stacks.length + 1}`
                  })
                  setSelectedStack(stackId)
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {stacks.map(stack => (
                <button
                  key={stack._id}
                  onClick={() => setSelectedStack(stack._id)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    stack._id === selectedStack
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="font-medium">{stack.name}</div>
                  <div className="text-xs opacity-70">
                    {stack.cells.length} cells
                  </div>
                </button>
              ))}
            </div>
          </Card>

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
  )
}