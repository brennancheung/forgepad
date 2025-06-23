"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send } from "lucide-react"
import { StackDisplay } from "./StackDisplay"
import { generateWithAI } from "@/actions/ai"
import { Id } from "@convex/_generated/dataModel"
import { useKeyboard } from "@/lib/keyboard"

interface StackViewProps {
  stackId: Id<"stacks">
  stackName?: string
  cellCount?: number
}

export function StackView({ stackId, stackName, cellCount }: StackViewProps) {
  const keyboard = useKeyboard()
  const [input, setInput] = useState("")
  
  const createCell = useMutation(api.cells.create)
  
  // Check if any cells are currently streaming
  const cells = useQuery(api.cells.listByStack, { stackId })
  const hasStreamingCell = cells?.some(cell => cell.status === "streaming" || cell.status === "pending")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || hasStreamingCell) return

    const promptText = input.trim()
    setInput("")

    try {
      // First, create a cell for the user's prompt
      await createCell({
        stackId,
        content: promptText,
        type: "prompt",
        status: "complete"
      })

      // Then generate AI response (don't await so UI isn't blocked)
      generateWithAI({
        prompt: promptText,
        stackId,
        model: "gpt-4o-mini"
      }).catch(error => {
        console.error("Generation failed:", error)
      })
    } catch (error) {
      console.error("Generation error:", error)
    }
  }

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Stack Display */}
      <Card className="flex-1 flex flex-col overflow-hidden min-h-0" style={{ maxHeight: 'calc(100vh - 400px)' }}>
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold">
            {stackName || "Stack"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {cellCount ?? cells?.length ?? 0} cells
          </span>
        </div>
        
        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <StackDisplay stackId={stackId} maxHeight="100%" />
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
            onFocus={() => {
              keyboard.setMode('insert')
            }}
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
              disabled={!input.trim() || hasStreamingCell}
            >
              {hasStreamingCell ? (
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
  )
}