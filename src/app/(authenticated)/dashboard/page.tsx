import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Layers, Database, Plus, ArrowUpDown } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Your stack-based LLM workspace
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common stack operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/stack/new">
                <Plus className="mr-2 h-4 w-4" />
                New Stack
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/stack">
                <Layers className="mr-2 h-4 w-4" />
                View Stacks
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/cells">
                <Database className="mr-2 h-4 w-4" />
                Named Cells
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/operations">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Stack Operations
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Build your first LLM workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm">
              <li className="flex gap-2">
                <span className="font-semibold text-muted-foreground">1.</span>
                Create a new workspace from the sidebar
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-muted-foreground">2.</span>
                Push prompts and data onto the stack
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-muted-foreground">3.</span>
                Apply operations like query, expand, filter, and merge
              </li>
              <li className="flex gap-2">
                <span className="font-semibold text-muted-foreground">4.</span>
                Save important results as named cells for reuse
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </>
  )
}