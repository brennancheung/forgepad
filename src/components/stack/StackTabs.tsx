'use client'

import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { Id } from '@convex/_generated/dataModel'
import { StackView } from './StackView'
import { cn } from '@/lib/utils'
import { useKeyboard } from '@/lib/keyboard'

type StackWithCount = {
  _id: Id<'stacks'>
  _creationTime: number
  name: string
  workspaceId: Id<'workspaces'>
  userId: Id<'users'>
  order?: number
  createdAt: number
  updatedAt: number
  cellCount: number
}

interface StackTabsProps {
  workspaceId: Id<'workspaces'>
  stacks: StackWithCount[]
  selectedStackId: Id<'stacks'> | null
  onStackSelect: (stackId: Id<'stacks'>) => void
}

export function StackTabs({ workspaceId, stacks, selectedStackId, onStackSelect }: StackTabsProps) {
  const createStack = useMutation(api.stacks.create)
  const deleteStack = useMutation(api.stacks.deleteStack)

  // Handle keyboard navigation
  const { requestFocus } = useKeyboard({
    focusOnMount: true,
    onKeyboardCommand: (command) => {
      const currentIndex = stacks.findIndex((s) => s._id === selectedStackId)
      if (currentIndex === -1) return
      
      switch (command.type) {
        case 'MOVE_LEFT':
          if (currentIndex > 0) onStackSelect(stacks[currentIndex - 1]._id)
          break
        case 'MOVE_RIGHT':
          if (currentIndex < stacks.length - 1) onStackSelect(stacks[currentIndex + 1]._id)
          break
      }
    },
  })

  const handleCreateStack = async () => {
    const stackId = await createStack({
      workspaceId,
      name: `Stack ${stacks.length + 1}`,
    })
    onStackSelect(stackId)
  }

  const handleDeleteStack = async (stackId: Id<'stacks'>, e: React.MouseEvent) => {
    e.stopPropagation()

    // If deleting the selected stack, select another one
    if (stackId === selectedStackId) {
      const remainingStacks = stacks.filter((s) => s._id !== stackId)
      if (remainingStacks.length > 0) {
        onStackSelect(remainingStacks[0]._id)
      }
    }

    await deleteStack({ stackId })
  }

  return (
    <Tabs
      value={selectedStackId || ''}
      onValueChange={(value) => onStackSelect(value as Id<'stacks'>)}
      className="flex flex-col h-full"
      onClick={() => requestFocus()}
    >
      <div className="border-b">
        <TabsList className="h-auto p-0 bg-transparent rounded-none w-full justify-start">
          {stacks.map((stack) => (
            <TabsTrigger
              key={stack._id}
              value={stack._id}
              className={cn(
                'relative px-4 py-2 rounded-none border-b-2 border-transparent group',
                'data-[state=active]:border-foreground data-[state=active]:bg-transparent',
                'hover:bg-muted/50 transition-colors flex items-center gap-1'
              )}
            >
              <span className="mr-2">{stack.name}</span>
              <span className="text-xs text-muted-foreground">({stack.cellCount})</span>
              {stacks.length > 1 && (
                <div
                  className={cn(
                    'h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity',
                    'hover:bg-muted rounded-sm flex items-center justify-center cursor-pointer'
                  )}
                  onClick={(e) => handleDeleteStack(stack._id, e)}
                >
                  <X className="h-3 w-3" />
                </div>
              )}
            </TabsTrigger>
          ))}
          <Button variant="ghost" size="sm" onClick={handleCreateStack} className="ml-2 h-8 px-2">
            <Plus className="h-4 w-4" />
          </Button>
        </TabsList>
      </div>

      {stacks.map((stack) => (
        <TabsContent key={stack._id} value={stack._id} className="flex-1 mt-0 overflow-hidden">
          <StackView stackId={stack._id} stackName={stack.name} cellCount={stack.cellCount} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
