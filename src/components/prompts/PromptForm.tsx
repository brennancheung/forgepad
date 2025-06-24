'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { validatePromptName, extractVariables } from '@/lib/prompts'
import { Loader2 } from 'lucide-react'

interface PromptFormProps {
  prompt?: {
    _id: string
    name: string
    description: string
    content: string
  }
  onSubmit: (data: {
    name: string
    description: string
    content: string
  }) => Promise<void>
  isLoading?: boolean
}

export function PromptForm({ prompt, onSubmit, isLoading }: PromptFormProps) {
  const router = useRouter()
  const [name, setName] = useState(prompt?.name || '')
  const [description, setDescription] = useState(prompt?.description || '')
  const [content, setContent] = useState(prompt?.content || '')
  const [nameError, setNameError] = useState<string | null>(null)
  const [variables, setVariables] = useState<string[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    setVariables(extractVariables(content))
  }, [content])

  const handleNameChange = (value: string) => {
    setName(value)
    const validation = validatePromptName(value)
    setNameError(validation.valid ? null : validation.error || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    const validation = validatePromptName(name)
    if (!validation.valid) {
      setNameError(validation.error || 'Invalid name')
      return
    }

    try {
      await onSubmit({
        name,
        description,
        content,
      })
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="youtube_hook_generator"
          disabled={isLoading}
        />
        {nameError && (
          <p className="text-sm text-destructive">{nameError}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Use only letters, numbers, and underscores
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Generate compelling YouTube video hooks"
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          Brief description to help you find this prompt
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content">Template</Label>
          {variables.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Variables:</span>
              {variables.map((variable) => (
                <Badge key={variable} variant="secondary">
                  {variable}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a compelling hook for a YouTube video about {{topic}}..."
          className="min-h-[300px] font-mono"
          disabled={isLoading}
        />
        <p className="text-sm text-muted-foreground">
          Use {'{{variable}}'} syntax to create template variables
        </p>
      </div>

      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading || !!nameError}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {prompt ? 'Update Prompt' : 'Create Prompt'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/prompts')}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}