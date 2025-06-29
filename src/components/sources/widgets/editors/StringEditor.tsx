'use client'

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface StringEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export const StringEditor = ({
  value,
  onChange,
  disabled,
  className,
}: StringEditorProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm text-muted-foreground">String Value</Label>
        <span className="text-xs text-muted-foreground">
          {value.length} characters
        </span>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Enter string value..."
        rows={6}
        className="font-mono text-sm"
      />
    </div>
  )
}