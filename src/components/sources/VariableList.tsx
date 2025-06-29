'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronRight, List, MoreHorizontal, Pencil, Trash } from 'lucide-react'
import { Id } from '@convex/_generated/dataModel'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { VariableItem } from './VariableItem'
import { parseSourceVariables, type VariableItem as VariableItemType } from '@/lib/sources/types'
import { KeyboardInput } from '@/components/keyboard/KeyboardInput'
import { cn } from '@/lib/utils'

interface Source {
  id: Id<'sources'>
  name: string
  type: string
  content?: string
}

interface VariableListProps {
  initialSource?: Source
  onUpdateSource: (
    id: Id<'sources'>,
    name: string,
    type: string,
    content?: string
  ) => Promise<void>
  onDeleteSource: (id: Id<'sources'>) => Promise<void>
  onCreateSource: (name: string, type: string, content?: string) => Promise<void>
  isNew?: boolean
  isExpanded?: boolean
  onExpandChange?: (isExpanded: boolean) => void
  autofocusAddInput?: boolean
}

export const VariableList = ({
  initialSource,
  onUpdateSource,
  onDeleteSource,
  onCreateSource,
  isNew = false,
  isExpanded = false,
  onExpandChange,
  autofocusAddInput = false,
}: VariableListProps) => {
  const [isEditing, setIsEditing] = useState(isNew)
  const [itemName, setItemName] = useState('')
  const [variableName, setVariableName] = useState('')
  const [editedName, setEditedName] = useState('')
  const [isHovering, setIsHovering] = useState(false)
  const [source, setSource] = useState<Source | null>(initialSource || null)
  
  const handleStartEditing = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (source) setEditedName(source.name)
    setIsEditing(true)
  }

  const handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isNew && !source) setVariableName(e.target.value)
  }

  const handleNameInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      handleNameSave()
      return
    }
    if (e.key === 'Escape') handleNameCancel()
  }

  const handleVariableInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItemName(e.target.value)
  }

  const handleVariableInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddVariable()
    }
  }

  const nameInputRef = useRef<HTMLInputElement>(null)
  const variableInputRef = useRef<HTMLInputElement>(null)

  // Focus name input when editing starts
  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    if (!initialSource) return
    if (source && initialSource.id === source.id) return
    setSource(initialSource)
  }, [initialSource, source])

  useEffect(() => {
    if (!source || !isNew || !variableInputRef.current) return
    onExpandChange?.(true)
    setIsEditing(false)
  }, [source, isNew, onExpandChange])

  useEffect(() => {
    if (!autofocusAddInput || !variableInputRef.current || !source) return
    variableInputRef.current.focus()
  }, [autofocusAddInput, source])

  // Handle creating a new source
  const createNewSource = async (name: string) => {
    await onCreateSource(name, 'array', '[]')
    setVariableName('')
  }

  // Handle updating existing source name
  const updateSourceName = async (name: string) => {
    if (!source) return
    await onUpdateSource(source.id, name, source.type, source.content)
    setSource({ ...source, name })
    setIsEditing(false)
  }

  const handleNameSave = async (e?: React.MouseEvent | React.FocusEvent) => {
    if (e) e.stopPropagation()
    
    if (isNew && !source) {
      const trimmedName = variableName.trim()
      if (!trimmedName) return
      await createNewSource(trimmedName)
      return
    }

    const trimmedName = editedName.trim()
    if (!trimmedName) return
    await updateSourceName(trimmedName)
  }

  const handleNameCancel = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (isNew && !source) setVariableName('')
    if (source) setEditedName(source.name)
    setIsEditing(false)
  }

  const handleDeleteSource = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!source) return

    onDeleteSource(source.id)
  }

  // Update source with new items
  const updateSourceItems = async (items: VariableItemType[]) => {
    if (!source) return
    const content = JSON.stringify(items)
    await onUpdateSource(source.id, source.name, source.type, content)
    setSource({ ...source, content })
  }

  const handleDeleteVariable = async (idx: number) => {
    if (!source) return
    const result = parseSourceVariables(source.content)
    if (!Array.isArray(result)) return
    const filteredItems = result.filter((_, i) => i !== idx)
    await updateSourceItems(filteredItems)
  }

  const handleAddVariable = async () => {
    const trimmedName = itemName.trim()
    if (!trimmedName || !source) return

    const result = parseSourceVariables(source.content)
    const baseItems = Array.isArray(result) ? result : []
    const newItem: VariableItemType = {
      label: trimmedName,
      enable: true
    }
    const updatedItems = [...baseItems, newItem]

    await updateSourceItems(updatedItems)
    setItemName('')
    variableInputRef.current?.focus()
  }

  // Update a specific item property
  const updateItemProperty = async (
    idx: number, 
    update: Partial<VariableItemType>
  ) => {
    if (!source) return
    const result = parseSourceVariables(source.content)
    if (!Array.isArray(result)) return

    const updatedItems = [...result]
    updatedItems[idx] = { ...updatedItems[idx], ...update }
    await updateSourceItems(updatedItems)
  }

  const handleRenameVariable = async (idx: number, newName: string) => {
    await updateItemProperty(idx, { label: newName })
  }

  const handleToggleVisibility = async (idx: number, isVisible: boolean) => {
    await updateItemProperty(idx, { enable: isVisible })
  }

  const renderVariables = (src: Source) => {
    const vars = parseSourceVariables(src.content)
    
    return vars.map((item: VariableItemType, i: number) => (
      <VariableItem 
        key={i} 
        item={item} 
        onDelete={() => handleDeleteVariable(i)}
        onRename={(newName) => handleRenameVariable(i, newName)}
        onToggleVisibility={(isVisible) => handleToggleVisibility(i, isVisible)}
      />
    ))
  }

  // If we're not creating and have no source, don't render
  if (!isNew && !source) return null

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={onExpandChange}
      className="group/collapsible"
      data-source-id={source?.id}
    >
      <CollapsibleTrigger asChild>
        {isEditing ? (
          <div className="flex w-full h-8 items-center gap-2 px-2 py-1">
            <List className="h-4 w-4" />
            <KeyboardInput
              ref={nameInputRef}
              type="text"
              value={isNew && !source ? variableName : editedName}
              onChange={isNew && !source ? handleNameInputChange : (e) => setEditedName(e.target.value)}
              onKeyDown={handleNameInputKeyDown}
              onBlur={handleNameSave}
              onClick={(e) => e.stopPropagation()}
              placeholder="Variable list name"
              className="flex-1 bg-muted border border-input rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-ring text-sm"
            />
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start px-2 h-8"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            <List className="h-4 w-4 mr-2" />
            <span 
              onDoubleClick={handleStartEditing}
              className="flex-1 text-left"
            >
              {source?.name || 'New Variable List'}
            </span>
            <div className="ml-auto flex items-center gap-1">
              {source && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div 
                      className={cn(
                        "p-1 rounded-sm cursor-pointer",
                        isHovering && !isEditing ? 'opacity-100' : 'opacity-0'
                      )}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                    }}
                  >
                    <DropdownMenuItem onClick={handleStartEditing}>
                      <Pencil className="h-4 w-4 mr-2" />
                      <span>Rename</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDeleteSource}>
                      <Trash className="h-4 w-4 mr-2" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </div>
          </Button>
        )}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="pl-6 space-y-1">
          {source && renderVariables(source)}
          <KeyboardInput
            ref={variableInputRef}
            type="text"
            value={itemName}
            onChange={handleVariableInputChange}
            onKeyDown={handleVariableInputKeyDown}
            placeholder="Add variable…"
            className="w-full bg-transparent outline-none text-sm py-1 px-2 hover:bg-muted/50 rounded placeholder:text-muted-foreground"
            disabled={!source}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}