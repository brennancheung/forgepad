"use client"

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Id } from "@convex/_generated/dataModel"
import { CellDisplay } from "./CellDisplay"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useKeyboard } from "@/lib/keyboard"

interface StackDisplayProps {
  stackId: Id<"stacks">
  maxHeight?: string
  onRequestPromptFocus?: () => void
}

export function StackDisplay({ stackId, onRequestPromptFocus }: StackDisplayProps) {
  const stack = useQuery(api.stacks.get, { id: stackId })
  const cells = useQuery(api.cells.listByStack, stack ? { stackId } : "skip")
  
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [hasNewContent, setHasNewContent] = useState(false)
  const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(null)
  const prevCellsLength = useRef(0)
  
  // Use keyboard hook to handle navigation
  useKeyboard({
    onKeyboardCommand: (command) => {
      if (!cells || cells.length === 0) return
      
      switch (command.type) {
        case 'MOVE_UP': {
          const currentIndex = selectedCellIndex ?? cells.length
          const newIndex = Math.max(0, currentIndex - 1)
          setSelectedCellIndex(newIndex)
          scrollCellIntoView(newIndex)
          break
        }
        case 'MOVE_DOWN': {
          const currentIndex = selectedCellIndex ?? -1
          const newIndex = Math.min(cells.length - 1, currentIndex + 1)
          setSelectedCellIndex(newIndex)
          scrollCellIntoView(newIndex)
          break
        }
        case 'EDIT': {
          // Request focus on the prompt input
          onRequestPromptFocus?.()
          break
        }
      }
    }
  })
  
  // Remove auto-focus to prevent infinite loops
  // Users can manually focus by clicking or using keyboard navigation
  
  // Scroll a specific cell into view
  const scrollCellIntoView = useCallback((index: number) => {
    if (!cells) return
    const sortedCells = [...cells].sort((a, b) => a.stackPosition - b.stackPosition)
    const cellId = sortedCells[index]?._id
    if (!cellId) return
    
    const cellElement = cellRefs.current.get(cellId)
    if (cellElement) {
      // Scroll to the top of the cell, with some padding from the top
      cellElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [cells])
  
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
            <div 
              key={cell._id} 
              ref={(el) => {
                if (el) cellRefs.current.set(cell._id, el)
                else cellRefs.current.delete(cell._id)
              }}
              className={cn(
                "relative transition-all duration-150",
              )}
            >
              {/* Selection indicator bar */}
              <div className={cn(
                "absolute -left-1 top-0 bottom-0 w-1 rounded-full transition-all duration-150",
                selectedCellIndex === index 
                  ? "bg-foreground" 
                  : "bg-transparent"
              )} />
              
              {/* Stack position indicator */}
              <div className={cn(
                "absolute -left-10 top-4 text-sm font-mono transition-all duration-150",
                selectedCellIndex === index 
                  ? "text-foreground font-bold" 
                  : "text-muted-foreground"
              )}>
                {index + 1}
              </div>
              
              <div className={cn(
                "transition-all duration-150 rounded-lg",
                selectedCellIndex === index && "bg-accent/50 ring-2 ring-foreground/20 shadow-md"
              )}>
                <CellDisplay cell={cell} />
              </div>
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