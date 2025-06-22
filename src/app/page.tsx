'use client'

import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Layers, GitBranch, Database, Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { isLoaded, userId } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && userId) router.push('/dashboard')
  }, [isLoaded, userId, router])

  // Show nothing while checking auth status or if user is logged in
  if (!isLoaded || userId) return null

  // Otherwise show the landing page
  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold mb-6">Forgepad.ai</h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Enhanced stack-based LLM interaction paradigm for constructing, routing, and visualizing iterative workflows
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </section>

      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Core Features</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Layers className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Interactive Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  RPN-inspired LIFO structure for composable LLM-driven workflows with real-time manipulation
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <GitBranch className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Multiple Workspaces</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create and manage multiple named stacks for different contexts and workflows
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Database className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Named Cells</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Persistent storage with stack items referenced by position or custom names
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Sparkles className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Rich Visualizations</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Interactive widgets and custom renderers for markdown, JSON, graphs, and more
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-6 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Primary Use Cases</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto mb-12">
            <div className="p-4 rounded-lg bg-muted/30">
              <h3 className="font-semibold mb-2">Interactive Deep Research</h3>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <h3 className="font-semibold mb-2">Prompt Engineering</h3>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <h3 className="font-semibold mb-2">Data Analysis & Insights</h3>
            </div>
            <div className="p-4 rounded-lg bg-muted/30">
              <h3 className="font-semibold mb-2">Agentic Flow Debugging</h3>
            </div>
          </div>
          <p className="text-lg text-muted-foreground mb-8">
            Experience the future of LLM interaction with our stack-based paradigm
          </p>
          <Button size="lg" asChild>
            <Link href="/sign-up">Start Building</Link>
          </Button>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-8">Example Command Flow</h2>
          <div className="max-w-3xl mx-auto">
            <Card className="bg-muted/20">
              <CardContent className="p-6">
                <pre className="text-sm overflow-x-auto">
                  <code>{`"Deep learning overview" query expand
save-cell dl-overview
new-stack cnn-branch
new-stack transformers-branch
"CNN" filter push-stack cnn-branch
"Transformers" filter push-stack transformers-branch
switch-stack cnn-branch
deep-dive interactive-filter summarize`}</code>
                </pre>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

    </div>
  )
}