'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { extractVariables } from '@/lib/prompts'
import { Id } from '@convex/_generated/dataModel'
import { Loader2, Edit, Copy, Trash2, Play } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { usePromptModal } from '@/hooks/use-prompt-modal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export default function ViewPromptPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const { openPromptSearch: _openPromptSearch } = usePromptModal()
  const [promptId, setPromptId] = useState<Id<'prompts'> | null>(null)
  
  useEffect(() => {
    params.then(p => setPromptId(p.id as Id<'prompts'>))
  }, [params])
  
  const prompt = useQuery(api.prompts.getPrompt, promptId ? { id: promptId } : 'skip')
  const deletePrompt = useMutation(api.prompts.deletePrompt)
  const duplicatePrompt = useMutation(api.prompts.duplicatePrompt)

  const handleDelete = async () => {
    if (!promptId) return
    try {
      await deletePrompt({ id: promptId })
      toast({
        title: 'Prompt deleted',
        description: 'The prompt has been deleted successfully.',
      })
      router.push('/prompts')
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to delete prompt. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleDuplicate = async () => {
    if (!promptId) return
    try {
      const newId = await duplicatePrompt({ id: promptId })
      toast({
        title: 'Prompt duplicated',
        description: 'The prompt has been duplicated successfully.',
      })
      router.push(`/prompts/${newId}/edit`)
    } catch (_error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate prompt. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleUsePrompt = () => {
    if (!prompt) return
    
    const vars = extractVariables(prompt.content)
    if (vars.length === 0) {
      // No variables, use directly
      toast({
        title: 'Prompt ready',
        description: 'The prompt has been copied. It will be integrated with the workspace in a future update.',
      })
      console.log('Prompt content:', prompt.content)
      // TODO: Insert into active workspace/stack textarea
    } else {
      // Has variables, open the modal
      // For now, we'll use the existing search modal
      // In the future, we might want a dedicated variable input modal
      toast({
        title: 'Variable input needed',
        description: 'Please use the prompt search (Ctrl+P) to fill in template variables.',
      })
    }
  }

  if (prompt === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (prompt === null) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-2">Prompt not found</h2>
        <p className="text-muted-foreground">This prompt doesn&apos;t exist or you don&apos;t have access to it.</p>
      </div>
    )
  }

  const variables = extractVariables(prompt.content)

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{prompt.name}</h1>
        <div className="flex gap-2">
          <Button onClick={handleUsePrompt}>
            <Play className="mr-2 h-4 w-4" />
            Use Prompt
          </Button>
          <Button variant="outline" onClick={() => promptId && router.push(`/prompts/${promptId}/edit`)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="outline" onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your prompt.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Description</p>
              <p>{prompt.description || 'No description provided'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Last updated</p>
              <p>{formatDistanceToNow(new Date(prompt.updatedAt), { addSuffix: true })}</p>
            </div>
            {variables.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Variables</p>
                <div className="flex flex-wrap gap-2">
                  {variables.map((variable) => (
                    <Badge key={variable} variant="secondary">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Template Content</CardTitle>
            <CardDescription>
              This is the template that will be used when you invoke this prompt
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-md">
              {prompt.content}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}