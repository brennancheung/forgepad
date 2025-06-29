'use client'

import { useState } from 'react'
import { EditableText } from './EditableText'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, MoreHorizontal, Pencil, Trash } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { VariableItem } from '@/lib/sources/types'

interface VariableItemEditorProps {
  item: VariableItem
  onUpdate: (item: VariableItem) => void
  onDelete: () => void
  disabled?: boolean
}

export const VariableItemEditor = ({ item, onUpdate, onDelete, disabled }: VariableItemEditorProps) => {
  const [isHovering, setIsHovering] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedLabel, setEditedLabel] = useState(item.label)
  
  const handleToggleVisibility = () => {
    if (disabled) return
    onUpdate({ ...item, enable: !item.enable })
  }
  
  const handleRename = (newLabel: string) => {
    const trimmedLabel = newLabel.trim()
    if (disabled || !trimmedLabel) return
    onUpdate({ ...item, label: trimmedLabel })
    setIsEditing(false)
  }
  
  const handleStartEdit = () => {
    if (disabled) return
    setEditedLabel(item.label)
    setIsEditing(true)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 px-2 py-1">
        <EditableText
          value={editedLabel}
          onChange={setEditedLabel}
          onBlur={() => handleRename(editedLabel)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleRename(editedLabel)
              return
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              setIsEditing(false)
              setEditedLabel(item.label)
            }
          }}
          autoFocus
          className="flex-1"
        />
      </div>
    )
  }

  return (
    <div
      className="flex items-center gap-2 px-2 py-1 hover:bg-red-100/50 rounded group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Button
        size="sm"
        variant="ghost"
        onClick={handleToggleVisibility}
        disabled={disabled}
        className={cn(
          'h-6 w-6 p-0',
          item.enable ? 'opacity-90 hover:opacity-100' : 'opacity-50 hover:opacity-70'
        )}
      >
        {item.enable ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </Button>
      
      <span 
        className={cn(
          'flex-1 cursor-pointer',
          item.enable ? 'text-foreground' : 'text-muted-foreground opacity-60'
        )}
        onDoubleClick={handleStartEdit}
      >
        {item.label}
      </span>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled}
            className={cn(
              'h-6 w-6 p-0 transition-opacity',
              isHovering ? 'opacity-100' : 'opacity-0'
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleStartEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete}>
            <Trash className="h-4 w-4 mr-2" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}