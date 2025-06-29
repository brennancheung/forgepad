"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { KeyboardInput } from "@/components/keyboard/KeyboardInput"

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  onBlur?: () => void
  onKeyDown?: (e: React.KeyboardEvent) => void
}

export const EditableText = ({
  value,
  onChange,
  placeholder = "Click to edit",
  className,
  autoFocus = false,
  onBlur,
  onKeyDown
}: EditableTextProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEditing || !inputRef.current) return
    inputRef.current.focus()
    inputRef.current.select()
  }, [isEditing])

  useEffect(() => {
    if (!autoFocus || !inputRef.current) return
    inputRef.current.focus()
    setIsEditing(true)
  }, [autoFocus])

  const handleClick = () => {
    setIsEditing(true)
    setEditValue(value)
  }

  const handleBlur = () => {
    setIsEditing(false)
    onChange(editValue)
    onBlur?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      setIsEditing(false)
      onChange(editValue)
      onKeyDown?.(e)
      return
    }
    if (e.key === "Escape") {
      e.preventDefault()
      setIsEditing(false)
      setEditValue(value)
      return
    }
    onKeyDown?.(e)
  }

  if (isEditing) {
    return (
      <KeyboardInput
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          "px-2 py-1 border border-input rounded focus:outline-none focus:ring-1 focus:ring-ring",
          className
        )}
      />
    )
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        "px-2 py-1 cursor-pointer hover:bg-muted rounded",
        !value && "text-muted-foreground",
        className
      )}
    >
      {value || placeholder}
    </div>
  )
}