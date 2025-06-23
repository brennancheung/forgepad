"use client"

import { useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
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

interface StackListProps {
  workspaceId: Id<"workspaces">
  stacks: StackWithCount[]
  selectedStackId: Id<"stacks"> | null
  onStackSelect: (stackId: Id<"stacks">) => void
}

export function StackList({ 
  workspaceId, 
  stacks, 
  selectedStackId, 
  onStackSelect 
}: StackListProps) {
  const createStack = useMutation(api.stacks.create)

  const handleCreateStack = async () => {
    const stackId = await createStack({
      workspaceId,
      name: `Stack ${stacks.length + 1}`
    })
    onStackSelect(stackId)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Stacks</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCreateStack}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {stacks.map(stack => (
          <button
            key={stack._id}
            onClick={() => onStackSelect(stack._id)}
            className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
              stack._id === selectedStackId
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            <div className="font-medium">{stack.name}</div>
            <div className="text-xs opacity-70">
              {stack.cellCount || 0} cells
            </div>
          </button>
        ))}
      </div>
    </Card>
  )
}