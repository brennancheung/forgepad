'use client'

import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { SourceType } from '@convex/types/sources'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { FileText, List, Code, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Id } from '@convex/_generated/dataModel'
import {
  validateSourceName,
  getSourceNameError,
  getSourceValueError,
} from '@convex/sources/validation'

interface SourceQuickAddWidgetProps {
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
  defaultType?: SourceType
  onComplete?: (sourceId: Id<'sources'>) => void
  onCancel?: () => void
  className?: string
  autoFocus?: boolean
}

const typeOptions: { value: SourceType; label: string; icon: React.ReactNode }[] = [
  { value: 'string', label: 'String', icon: <FileText className="h-4 w-4" /> },
  { value: 'array', label: 'Array', icon: <List className="h-4 w-4" /> },
  { value: 'json', label: 'JSON', icon: <Code className="h-4 w-4" /> },
]

export function SourceQuickAddWidget({
  workspaceId,
  stackId,
  defaultType = 'string',
  onComplete,
  onCancel,
  className,
  autoFocus = true,
}: SourceQuickAddWidgetProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<SourceType>(defaultType)
  const [value, setValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [continueAdding, setContinueAdding] = useState(false)
  
  const createSource = useMutation(api.sources.mutations.createSource)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate name
    const nameError = getSourceNameError(name)
    if (nameError) {
      toast.error(nameError)
      return
    }

    // Parse and validate value
    let parsedValue: string | unknown[] | Record<string, unknown> = value
    if (type === 'array') {
      try {
        parsedValue = value.split('\n').filter(line => line.trim())
      } catch {
        toast.error('Invalid array format')
        return
      }
    } else if (type === 'json') {
      try {
        parsedValue = JSON.parse(value)
      } catch {
        toast.error('Invalid JSON format')
        return
      }
    }

    const valueError = getSourceValueError(type, parsedValue)
    if (valueError) {
      toast.error(valueError)
      return
    }

    setIsSubmitting(true)
    try {
      const sourceId = await createSource({
        name,
        type,
        value: parsedValue,
        workspaceId,
        stackId,
      })
      
      const scope = stackId ? 'stack' : workspaceId ? 'workspace' : 'user'
      toast.success(`Source "${name}" created in ${scope} scope`)
      
      if (continueAdding) {
        setName('')
        setValue('')
      } else {
        onComplete?.(sourceId)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create source')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setName('')
    setValue('')
    onCancel?.()
  }

  const getScopeLabel = () => {
    if (stackId) return 'Stack'
    if (workspaceId) return 'Workspace'
    return 'User'
  }

  const getPlaceholder = () => {
    switch (type) {
      case 'string':
        return 'Enter text value...'
      case 'array':
        return 'Enter items, one per line...'
      case 'json':
        return '{\n  "key": "value"\n}'
    }
  }

  return (
    <Card className={cn('p-4', className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Quick Add Source</h3>
          <Badge variant="secondary" className="text-xs">
            {getScopeLabel()} scope
          </Badge>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-source"
            autoFocus={autoFocus}
            disabled={isSubmitting}
          />
          {name && !validateSourceName(name) && (
            <p className="text-sm text-destructive">
              {getSourceNameError(name)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <RadioGroup
            value={type}
            onValueChange={(v) => setType(v as SourceType)}
            disabled={isSubmitting}
          >
            <div className="flex gap-3">
              {typeOptions.map((option) => (
                <div key={option.value} className="flex items-center">
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="sr-only"
                  />
                  <Label
                    htmlFor={option.value}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors',
                      type === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-input hover:bg-accent'
                    )}
                  >
                    {option.icon}
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="value">Value</Label>
          <Textarea
            id="value"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={getPlaceholder()}
            rows={type === 'json' ? 6 : 4}
            className="font-mono text-sm"
            disabled={isSubmitting}
          />
          {type === 'array' && value && (
            <p className="text-sm text-muted-foreground">
              {value.split('\n').filter(line => line.trim()).length} items
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={continueAdding}
              onChange={(e) => setContinueAdding(e.target.checked)}
              className="rounded"
              disabled={isSubmitting}
            />
            Add another
          </label>
          
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || !name || !value}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  )
}