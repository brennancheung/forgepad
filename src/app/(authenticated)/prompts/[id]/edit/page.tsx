'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { PromptForm } from '@/components/prompts/PromptForm'
import { Id } from '@convex/_generated/dataModel'
import { Loader2 } from 'lucide-react'

export default function EditPromptPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const [promptId, setPromptId] = useState<Id<'prompts'> | null>(null)
  
  useEffect(() => {
    params.then(p => setPromptId(p.id as Id<'prompts'>))
  }, [params])
  
  const prompt = useQuery(api.prompts.getPrompt, promptId ? { id: promptId } : 'skip')
  const updatePrompt = useMutation(api.prompts.updatePrompt)

  const handleSubmit = async (data: {
    name: string
    description: string
    content: string
  }) => {
    if (!promptId) return
    try {
      await updatePrompt({
        id: promptId,
        ...data,
      })
      toast({
        title: 'Prompt updated',
        description: 'Your prompt has been updated successfully.',
      })
      router.push(`/prompts/${promptId}`)
    } catch (error) {
      throw error
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

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Edit Prompt</h1>
      <PromptForm prompt={prompt} onSubmit={handleSubmit} />
    </div>
  )
}