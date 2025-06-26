'use client'

import { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, FileJson, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface JsonEditorProps {
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
  disabled?: boolean
  className?: string
}

export function JsonEditor({
  value,
  onChange,
  disabled,
  className,
}: JsonEditorProps) {
  const [textValue, setTextValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(true)

  useEffect(() => {
    try {
      setTextValue(JSON.stringify(value, null, 2))
      setError(null)
      setIsValid(true)
    } catch (_e) {
      setError('Invalid JSON object')
      setIsValid(false)
    }
  }, [value])

  const handleTextChange = (text: string) => {
    setTextValue(text)
    
    if (!text.trim()) {
      setError('JSON cannot be empty')
      setIsValid(false)
      return
    }

    try {
      const parsed = JSON.parse(text)
      
      // Ensure it's an object, not an array or primitive
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setError('Value must be a JSON object (not an array or primitive)')
        setIsValid(false)
        return
      }
      
      onChange(parsed)
      setError(null)
      setIsValid(true)
    } catch (_e) {
      setError(_e instanceof Error ? _e.message : 'Invalid JSON')
      setIsValid(false)
    }
  }

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(textValue)
      setTextValue(JSON.stringify(parsed, null, 2))
      setError(null)
      setIsValid(true)
    } catch (_e) {
      // Error is already shown
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(textValue)
  }

  const handleImport = () => {
    const input = prompt('Paste JSON object:')
    if (input) {
      handleTextChange(input)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">JSON Object</Label>
          {isValid ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-destructive" />
          )}
        </div>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleImport}
            disabled={disabled}
            title="Import JSON"
          >
            <FileJson className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            disabled={disabled}
            title="Copy to clipboard"
          >
            <Copy className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleFormat}
            disabled={disabled || !isValid}
          >
            Format
          </Button>
        </div>
      </div>

      <Textarea
        value={textValue}
        onChange={(e) => handleTextChange(e.target.value)}
        disabled={disabled}
        placeholder='{\n  "key": "value"\n}'
        rows={10}
        className={cn(
          'font-mono text-sm',
          !isValid && 'border-destructive focus-visible:ring-destructive'
        )}
      />

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <div className="text-xs text-muted-foreground">
        <p>Tips:</p>
        <ul className="list-disc list-inside mt-1 space-y-0.5">
          <li>Must be a valid JSON object (not an array)</li>
          <li>Use double quotes for keys and string values</li>
          <li>Ctrl+Enter to format</li>
        </ul>
      </div>
    </div>
  )
}