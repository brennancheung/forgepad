'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { KeyboardTextarea } from '@/components/keyboard/KeyboardInput'

interface InlineJSONEditorProps {
  value: string
  onChange: (value: string, isValid: boolean) => void
  placeholder?: string
  disabled?: boolean
  minHeight?: number
  maxHeight?: number
  className?: string
  onBlur?: () => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

export function InlineJSONEditor({
  value,
  onChange,
  placeholder = 'Enter JSON...',
  disabled = false,
  minHeight = 3,
  maxHeight = 10,
  className,
  onBlur,
  onKeyDown
}: InlineJSONEditorProps) {
  const [isValid, setIsValid] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const validateJSON = useCallback((text: string) => {
    if (!text.trim()) {
      setIsValid(true)
      setError(null)
      return true
    }

    try {
      JSON.parse(text)
      setIsValid(true)
      setError(null)
      return true
    } catch (e) {
      setIsValid(false)
      setError(e instanceof Error ? e.message : 'Invalid JSON')
      return false
    }
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const valid = validateJSON(newValue)
    onChange(newValue, valid)
  }, [onChange, validateJSON])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Call the parent's onKeyDown if provided
    onKeyDown?.(e)
    
    if (e.key === 'Tab' && !e.defaultPrevented) {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      const valid = validateJSON(newValue)
      onChange(newValue, valid)
      
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2
      }, 0)
    }
  }, [value, onChange, validateJSON, onKeyDown])

  useEffect(() => {
    validateJSON(value)
  }, [value, validateJSON])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const lineHeight = parseInt(getComputedStyle(textareaRef.current).lineHeight)
      const minHeightPx = minHeight * lineHeight
      const maxHeightPx = maxHeight * lineHeight
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, minHeightPx), maxHeightPx)}px`
    }
  }, [value, minHeight, maxHeight])

  return (
    <div className="relative">
      <KeyboardTextarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full rounded-md border bg-background px-3 py-2",
          "font-mono text-sm resize-none",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isValid ? "border-input" : "border-destructive",
          className
        )}
        style={{
          minHeight: `${minHeight * 1.5}rem`,
          maxHeight: `${maxHeight * 1.5}rem`,
          overflowY: 'auto'
        }}
        spellCheck={false}
      />
      <div className="absolute top-2 right-2 pointer-events-none">
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            isValid ? "bg-green-500" : "bg-destructive"
          )}
          title={isValid ? "Valid JSON" : error || "Invalid JSON"}
        />
      </div>
    </div>
  )
}