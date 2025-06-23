"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { CellDisplay } from "./CellDisplay"
import { ScrollArea } from "@/components/ui/scroll-area"

interface StackDisplayProps {
  stackId: Id<"stacks">
  maxHeight?: string
}

export function StackDisplay({ stackId }: StackDisplayProps) {
  const stack = useQuery(api.stacks.get, { id: stackId })
  const cells = useQuery(api.cells.listByStack, stack ? { stackId } : "skip")

  if (!stack || !cells) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Loading stack...
      </div>
    )
  }

  if (cells.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        Stack is empty. Add a prompt to get started!
      </div>
    )
  }

  // Sort cells by stack position (oldest at top, newest at bottom)
  const sortedCells = [...cells].sort((a, b) => a.stackPosition - b.stackPosition)

  return (
    <ScrollArea className="w-full h-full">
      <div className="space-y-4 pr-4">
        {sortedCells.map((cell, index) => (
          <div key={cell._id} className="relative">
            {/* Stack position indicator */}
            <div className="absolute -left-8 top-4 text-sm text-muted-foreground font-mono">
              {index + 1}
            </div>
            
            <CellDisplay cell={cell} />
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}