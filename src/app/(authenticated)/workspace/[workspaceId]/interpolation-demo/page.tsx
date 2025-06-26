'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Id } from '@convex/_generated/dataModel'
import { InterpolationPreview } from '@/components/cells/InterpolatedCell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Code } from 'lucide-react'

export default function InterpolationDemoPage() {
  const params = useParams()
  const workspaceId = params.workspaceId as Id<'workspaces'>
  
  const [content, setContent] = useState(`Welcome to {{source:company}}!

Our mission is: {{source:mission}}

Contact us at:
- Email: {{source:contact.email}}
- Phone: {{source:contact.phone}}

Available products:
{{source:products[0]}}
{{source:products[1]}}

User preference: {{user:theme}}
Workspace setting: {{workspace:defaultModel}}`)

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Source Interpolation Demo</h1>
        <p className="text-muted-foreground">
          Test how source references are replaced with actual values
        </p>
      </div>

      <div className="space-y-6">
        <Alert>
          <Code className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2 mt-2">
              <p>Reference sources using these patterns:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code className="bg-muted px-1">{`{{source:name}}`}</code> - Auto-resolve by scope</li>
                <li><code className="bg-muted px-1">{`{{user:name}}`}</code> - User-level source</li>
                <li><code className="bg-muted px-1">{`{{workspace:name}}`}</code> - Workspace-level source</li>
                <li><code className="bg-muted px-1">{`{{stack:name}}`}</code> - Stack-level source</li>
                <li><code className="bg-muted px-1">{`{{source:array[0]}}`}</code> - Array index</li>
                <li><code className="bg-muted px-1">{`{{source:object.property}}`}</code> - Object property</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Input Text</CardTitle>
            <CardDescription>
              Enter text with source references to see them interpolated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="font-mono"
                placeholder="Enter text with {{source:name}} references..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interpolation Result</CardTitle>
            <CardDescription>
              Source references are replaced with their actual values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InterpolationPreview
              content={content}
              workspaceId={workspaceId}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ol className="space-y-2">
              <li>
                <strong>Parsing:</strong> The system scans text for patterns like <code>{`{{source:name}}`}</code>
              </li>
              <li>
                <strong>Resolution:</strong> Sources are resolved by scope hierarchy:
                <ul className="list-disc list-inside ml-4 mt-1">
                  <li>Stack sources (if in a stack context)</li>
                  <li>Workspace sources (if in a workspace)</li>
                  <li>User sources (always available)</li>
                </ul>
              </li>
              <li>
                <strong>Extraction:</strong> For arrays and objects, paths like <code>[0]</code> or <code>.property</code> extract specific values
              </li>
              <li>
                <strong>Interpolation:</strong> References are replaced with actual values in the text
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}