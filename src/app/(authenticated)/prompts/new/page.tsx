'use client'

import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { PromptForm } from '@/components/prompts/PromptForm'

export default function NewPromptPage() {
  const router = useRouter()
  const { toast } = useToast()
  const createPrompt = useMutation(api.prompts.createPrompt)

  const handleSubmit = async (data: {
    name: string
    description: string
    content: string
  }) => {
    try {
      const id = await createPrompt(data)
      toast({
        title: 'Prompt created',
        description: 'Your prompt has been created successfully.',
      })
      router.push(`/prompts/${id}`)
    } catch (error) {
      throw error
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create New Prompt</h1>
      <PromptForm onSubmit={handleSubmit} />
    </div>
  )
}