'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { extractVariables, substituteVariables } from '@/lib/prompts'
import { Search, ArrowLeft } from 'lucide-react'
import { Id } from '@convex/_generated/dataModel'

interface PromptSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (content: string) => void
}

type Phase = 'search' | 'variables'

export function PromptSearchModal({ open, onOpenChange, onInsert }: PromptSearchModalProps) {
  const [phase, setPhase] = useState<Phase>('search')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPrompt, setSelectedPrompt] = useState<{
    _id: Id<'prompts'>
    name: string
    description: string
    content: string
  } | null>(null)
  const [variables, setVariables] = useState<string[]>([])
  const [variableValues, setVariableValues] = useState<Record<string, string>>({})
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const prompts = useQuery(api.prompts.searchPrompts, { searchTerm })

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setPhase('search')
      setSearchTerm('')
      setSelectedPrompt(null)
      setVariables([])
      setVariableValues({})
      setHighlightedIndex(0)
    }
  }, [open])

  // Extract variables when prompt is selected
  useEffect(() => {
    if (selectedPrompt) {
      const vars = extractVariables(selectedPrompt.content)
      setVariables(vars)
      const initialValues: Record<string, string> = {}
      vars.forEach(v => initialValues[v] = '')
      setVariableValues(initialValues)
    }
  }, [selectedPrompt])

  const handleSelectPrompt = (prompt: NonNullable<typeof prompts>[0]) => {
    setSelectedPrompt(prompt)
    const vars = extractVariables(prompt.content)
    if (vars.length === 0) {
      // No variables, insert directly
      onInsert(prompt.content)
      onOpenChange(false)
    } else {
      // Has variables, move to variable input phase
      setPhase('variables')
    }
  }

  const handleInsert = () => {
    if (!selectedPrompt) return
    const finalContent = substituteVariables(selectedPrompt.content, variableValues)
    onInsert(finalContent)
    onOpenChange(false)
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (phase === 'search' && prompts) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlightedIndex((prev) => Math.min(prev + 1, prompts.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (prompts[highlightedIndex]) {
          handleSelectPrompt(prompts[highlightedIndex])
        }
      }
    } else if (phase === 'variables') {
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault()
        handleInsert()
      }
    }
  }, [phase, prompts, highlightedIndex])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" onKeyDown={handleKeyDown}>
        {phase === 'search' ? (
          <>
            <DialogHeader>
              <DialogTitle>Select a Prompt</DialogTitle>
              <DialogDescription>
                Search for a prompt template to insert
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search prompts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {prompts?.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground">
                    {searchTerm ? 'No prompts found' : 'No prompts created yet'}
                  </p>
                ) : (
                  prompts?.map((prompt, index) => (
                    <button
                      key={prompt._id}
                      onClick={() => handleSelectPrompt(prompt)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        index === highlightedIndex
                          ? 'bg-accent border-accent-foreground/20'
                          : 'hover:bg-accent/50 border-transparent'
                      }`}
                    >
                      <div className="font-medium">{prompt.name}</div>
                      {prompt.description && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {prompt.description}
                        </div>
                      )}
                      {extractVariables(prompt.content).length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {extractVariables(prompt.content).map((v) => (
                            <Badge key={v} variant="secondary" className="text-xs">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPhase('search')}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {selectedPrompt?.name}
              </DialogTitle>
              <DialogDescription>
                Fill in the template variables
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {variables.map((variable, index) => (
                <div key={variable} className="space-y-2">
                  <Label htmlFor={`var-${variable}`}>{variable}</Label>
                  <Input
                    id={`var-${variable}`}
                    value={variableValues[variable] || ''}
                    onChange={(e) => setVariableValues({
                      ...variableValues,
                      [variable]: e.target.value
                    })}
                    placeholder={`Enter ${variable}...`}
                    autoFocus={index === 0}
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInsert}>
                  Insert
                  <span className="ml-2 text-xs opacity-60">Ctrl+Enter</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}