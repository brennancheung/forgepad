'use client'

import React from 'react'
import { Trash, Pencil, MoreHorizontal, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { KeyboardInput } from '@/components/keyboard/KeyboardInput'
import { cn } from '@/lib/utils'
import type { VariableItem as VariableItemType } from '@/lib/sources/types'

interface VariableItemProps {
  item: VariableItemType
  onDelete: () => void
  onRename?: (newName: string) => void
  onToggleVisibility?: (isVisible: boolean) => void
}

export const VariableItem = ({ item, onDelete, onRename, onToggleVisibility }: VariableItemProps) => {
  const [isHovering, setIsHovering] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [editedName, setEditedName] = React.useState(item.label)
  const inputRef = React.useRef<HTMLInputElement>(null)
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete()
  }
  
  const handleRenameClick = (e: React.MouseEvent) => {
    if (!onRename) return
    e.stopPropagation()
    setEditedName(item.label)
    setIsEditing(true)
  }
  
  const handleSaveRename = () => {
    if (!onRename || !editedName.trim()) return
    onRename(editedName.trim())
    setIsEditing(false)
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      handleSaveRename()
      return
    }
    if (e.key === 'Escape') {
      setEditedName(item.label)
      setIsEditing(false)
    }
  }
  
  const handleToggleVisibility = (e: React.MouseEvent) => {
    if (!onToggleVisibility) return
    e.stopPropagation()
    onToggleVisibility(!item.enable)
  }
  
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  if (isEditing) {
    return (
      <div className="flex items-center w-full px-2 py-1">
        <KeyboardInput
          ref={inputRef}
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSaveRename}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-muted border border-input px-2 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-ring text-sm"
        />
      </div>
    )
  }

  return (
    <div 
      className="flex items-center justify-between w-full hover:bg-muted/50 rounded px-2 py-1 group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-center gap-2 flex-1">
        {onToggleVisibility && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleToggleVisibility}
            className={cn(
              "h-4 w-4 p-0",
              item.enable ? 'opacity-90 hover:opacity-100' : 'opacity-50 hover:opacity-70'
            )}
          >
            {item.enable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </Button>
        )}
        <span 
          className={cn(
            "text-sm",
            item.enable ? 'text-foreground' : 'text-muted-foreground opacity-60'
          )}
        >
          {item.label}
        </span>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-6 w-6 p-0",
              isHovering ? 'opacity-100' : 'opacity-0'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          onClick={(e) => e.stopPropagation()}
        >
          {onRename && (
            <DropdownMenuItem onClick={handleRenameClick}>
              <Pencil className="h-4 w-4 mr-2" />
              <span>Rename</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleDeleteClick}>
            <Trash className="h-4 w-4 mr-2" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}