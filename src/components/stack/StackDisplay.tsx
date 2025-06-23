"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { CellDisplay } from "./CellDisplay"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface StackDisplayProps {
  stackId: Id<"stacks">
  maxHeight?: string
}

export function StackDisplay({ stackId }: StackDisplayProps) {
  const stack = useQuery(api.stacks.get, { id: stackId })
  const cells = useQuery(api.cells.listByStack, stack ? { stackId } : "skip")
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [hasNewContent, setHasNewContent] = useState(false)
  const prevCellsLength = useRef(0)
  
  // Check if we're at the bottom of the scroll area
  const checkIsAtBottom = () => {
    if (!scrollAreaRef.current) return false
    const element = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
    if (!element) return false
    
    const threshold = 100 // px from bottom to consider "at bottom"
    const { scrollTop, scrollHeight, clientHeight } = element
    return scrollHeight - scrollTop - clientHeight < threshold
  }
  
  // Scroll to bottom
  const scrollToBottom = () => {
    if (!scrollAreaRef.current) return
    const element = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
    if (!element) return
    
    element.scrollTo({
      top: element.scrollHeight,
      behavior: 'smooth'
    })
    setIsAtBottom(true)
    setHasNewContent(false)
  }
  
  // Handle scroll events
  useEffect(() => {
    const element = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!element) return
    
    const handleScroll = () => {
      const atBottom = checkIsAtBottom()
      setIsAtBottom(atBottom)
      if (atBottom) {
        setHasNewContent(false)
      }
    }
    
    element.addEventListener('scroll', handleScroll)
    return () => element.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Auto-scroll on new content
  useEffect(() => {
    if (!cells) return
    
    // Check if cells have been added or if a cell is streaming
    const hasStreamingCell = cells.some(cell => cell.status === "streaming")
    const cellsAdded = cells.length > prevCellsLength.current
    
    // Check if the newest cell is a user prompt (always scroll for user input)
    const newestCell = cells.length > 0 ? cells[cells.length - 1] : null
    const isNewUserPrompt = cellsAdded && newestCell?.type === "prompt"
    
    if (cellsAdded || hasStreamingCell) {
      if (isAtBottom || isNewUserPrompt) {
        // Auto-scroll if we're at the bottom OR if user just submitted a prompt
        requestAnimationFrame(() => {
          scrollToBottom()
        })
      } else if (cellsAdded) {
        // Show "new content" indicator if we're not at bottom
        setHasNewContent(true)
      }
    }
    
    prevCellsLength.current = cells.length
  }, [cells, isAtBottom])

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
    <div className="relative w-full h-full">
      <ScrollArea ref={scrollAreaRef} className="w-full h-full">
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
      
      {/* Scroll to bottom button */}
      {hasNewContent && !isAtBottom && (
        <Button
          onClick={scrollToBottom}
          size="sm"
          variant="secondary"
          className={cn(
            "absolute bottom-4 right-4 shadow-lg",
            "flex items-center gap-2 transition-opacity",
            hasNewContent ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <ArrowDown className="h-4 w-4" />
          New messages
        </Button>
      )}
    </div>
  )
}