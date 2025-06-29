'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EditableText } from './EditableText'
import { VariableItemEditor } from './VariableItemEditor'
import { KeyboardInput } from '@/components/keyboard/KeyboardInput'
import { Plus, X, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VariableItem } from '@/lib/sources/types'
import { parseSourceVariables } from '@/lib/sources/types'

interface SourceArrayEditorProps {
  title?: string
  items: VariableItem[] | string[] | unknown
  onTitleChange?: (title: string) => void
  onItemsChange: (items: VariableItem[] | unknown) => void
  onChange?: (data: { title?: string; items: VariableItem[] }) => void
  onDelete?: () => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const SourceArrayEditor = ({
  title,
  items: rawItems,
  onTitleChange,
  onItemsChange,
  onChange,
  onDelete,
  placeholder = 'Add new item',
  className,
  disabled
}: SourceArrayEditorProps) => {
  const [newItem, setNewItem] = useState('')
  const newItemRef = useRef<HTMLInputElement>(null)
  
  // Parse items to ensure we have the correct format
  const items = parseSourceVariables(rawItems)

  const handleItemUpdate = (index: number, updatedItem: VariableItem) => {
    const newItems = [...items]
    newItems[index] = updatedItem
    onItemsChange(newItems)
    onChange?.({ title, items: newItems })
  }

  const handleAddItem = () => {
    const trimmedItem = newItem.trim()
    if (!trimmedItem) return
    
    const newVariableItem: VariableItem = {
      label: trimmedItem,
      enable: true
    }
    const newItems = [...items, newVariableItem]
    onItemsChange(newItems)
    onChange?.({ title, items: newItems })
    setNewItem('')
  }

  const handleDeleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    onItemsChange(newItems)
    onChange?.({ title, items: newItems })
  }

  const handleTitleChange = (newTitle: string) => {
    onTitleChange?.(newTitle)
    onChange?.({ title: newTitle, items })
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      newItemRef.current?.focus()
    }
  }

  // Convert lines to variable items
  const linesToVariableItems = (lines: string[]): VariableItem[] =>
    lines
      .filter(line => line.trim())
      .map(line => ({
        label: line.trim(),
        enable: true
      }))

  const handleImport = () => {
    const input = prompt('Paste items (one per line):')
    if (!input) return
    
    const lines = input.split('\n')
    const newItems = linesToVariableItems(lines)
    const updatedItems = [...items, ...newItems]
    onItemsChange(updatedItems)
    onChange?.({ title, items: updatedItems })
  }

  const handleClear = () => {
    if (!confirm('Clear all items?')) return
    onItemsChange([])
    onChange?.({ title, items: [] })
  }

  const handleSort = () => {
    const sorted = [...items].sort((a, b) => a.label.localeCompare(b.label))
    onItemsChange(sorted)
    onChange?.({ title, items: sorted })
  }

  return (
    <Card className={cn('p-4 bg-red-50 rounded-3xl border-0', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-1">
          <List className="h-4 w-4 text-gray-600" />
          {title !== undefined && onTitleChange ? (
            <EditableText
              value={title}
              onChange={handleTitleChange}
              placeholder="List title"
              className="text-lg font-semibold bg-transparent hover:bg-red-100/50 rounded px-2 py-1"
              onKeyDown={handleTitleKeyDown}
            />
          ) : (
            title && <h3 className="text-lg font-semibold">{title}</h3>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleImport}
            disabled={disabled}
            className="h-8 px-2 hover:bg-red-100"
            title="Import items"
          >
            Import
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSort}
            disabled={disabled || items.length === 0}
            className="h-8 px-2 hover:bg-red-100"
            title="Sort items"
          >
            Sort
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            disabled={disabled || items.length === 0}
            className="h-8 px-2 hover:bg-red-100"
            title="Clear all"
          >
            Clear
          </Button>
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              disabled={disabled}
              className="h-8 w-8 p-0 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        {items.map((item, index) => (
          <VariableItemEditor
            key={index}
            item={item}
            onUpdate={(updatedItem) => handleItemUpdate(index, updatedItem)}
            onDelete={() => handleDeleteItem(index)}
            disabled={disabled}
          />
        ))}
      </div>
      
      <div className="mt-3 flex gap-2">
        <KeyboardInput
          ref={newItemRef}
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddItem()
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-3 py-2 bg-white/50 border-0 rounded-md focus:outline-none focus:ring-2 focus:ring-red-200"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={handleAddItem}
          disabled={disabled || !newItem.trim()}
          className="bg-white/50 hover:bg-white/70"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}