'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, X, GripVertical, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ArrayEditorProps {
  value: unknown[]
  onChange: (value: unknown[]) => void
  disabled?: boolean
  className?: string
}

export function ArrayEditor({
  value,
  onChange,
  disabled,
  className,
}: ArrayEditorProps) {
  const [newItem, setNewItem] = useState('')
  const [draggedItem, setDraggedItem] = useState<number | null>(null)

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...value, newItem.trim()])
      setNewItem('')
    }
  }

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleEdit = (index: number, newValue: string) => {
    const updated = [...value]
    updated[index] = newValue
    onChange(updated)
  }

  const handleDragStart = (index: number) => {
    setDraggedItem(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedItem === null) return

    const draggedValue = value[draggedItem]
    const newArray = [...value]
    
    // Remove from old position
    newArray.splice(draggedItem, 1)
    
    // Insert at new position
    const adjustedIndex = draggedItem < dropIndex ? dropIndex - 1 : dropIndex
    newArray.splice(adjustedIndex, 0, draggedValue)
    
    onChange(newArray)
    setDraggedItem(null)
  }

  const handleImport = () => {
    const input = prompt('Paste items (one per line):')
    if (input) {
      const items = input.split('\n').filter(line => line.trim())
      onChange([...value, ...items])
    }
  }

  const handleClear = () => {
    if (confirm('Clear all items?')) {
      onChange([])
    }
  }

  const handleSort = () => {
    const sorted = [...value].sort((a, b) => String(a).localeCompare(String(b)))
    onChange(sorted)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm text-muted-foreground">
          Array Items ({value.length})
        </Label>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleImport}
            disabled={disabled}
            title="Import from clipboard"
          >
            <Upload className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSort}
            disabled={disabled || value.length === 0}
          >
            Sort
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled || value.length === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder="Add item..."
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={disabled || !newItem.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {value.length > 0 && (
        <ScrollArea className="h-[200px] rounded-md border">
          <div className="p-2 space-y-1">
            {value.map((item, index) => (
              <div
                key={index}
                draggable={!disabled}
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-md bg-muted/50',
                  'hover:bg-muted transition-colors',
                  draggedItem === index && 'opacity-50',
                  !disabled && 'cursor-move'
                )}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={String(item)}
                  onChange={(e) => handleEdit(index, e.target.value)}
                  disabled={disabled}
                  className="flex-1 h-8"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}