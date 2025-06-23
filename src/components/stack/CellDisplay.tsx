"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle, FileText, MessageSquare, Code, Database } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from 'remark-gfm'
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

interface CellDisplayProps {
  cell: {
    _id: string
    content: string
    type: "text" | "prompt" | "response" | "data" | "code" | "widget" | "computational"
    status: "pending" | "streaming" | "complete" | "error" | "cancelled"
    error?: string
    metadata?: {
      prompt?: string
      model?: string
      temperature?: number
      tokenCount?: number
      streamedChunks?: number
      startedAt?: number
      completedAt?: number
    }
    createdAt: number
  }
}

export function CellDisplay({ cell }: CellDisplayProps) {
  const getTypeIcon = () => {
    switch (cell.type) {
      case "prompt":
        return <MessageSquare className="h-4 w-4" />
      case "response":
        return <FileText className="h-4 w-4" />
      case "code":
        return <Code className="h-4 w-4" />
      case "data":
        return <Database className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusIcon = () => {
    switch (cell.status) {
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin" />
      case "streaming":
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />
      case "complete":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    // Special styling for prompt cells
    if (cell.type === "prompt") {
      return "bg-secondary/50 border-secondary"
    }
    
    switch (cell.status) {
      case "pending":
        return "bg-muted"
      case "streaming":
        return "bg-primary/10 border-primary/50"
      case "complete":
        return "bg-background"
      case "error":
        return "bg-destructive/10 border-destructive/50"
      default:
        return "bg-background"
    }
  }

  return (
    <Card className={cn(
      "transition-all duration-200 overflow-hidden",
      getStatusColor(),
      cell.status === "streaming" && "shadow-lg relative z-10"
    )}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getTypeIcon()}
            <Badge variant="outline" className="text-xs">
              {cell.type}
            </Badge>
            {cell.metadata?.model && (
              <Badge variant="secondary" className="text-xs">
                {cell.metadata.model}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {getStatusIcon()}
            <span className="text-xs">
              {cell.status === "streaming" && cell.metadata?.streamedChunks && (
                <>{cell.metadata.streamedChunks} chunks</>
              )}
              {cell.status === "complete" && cell.metadata?.tokenCount && (
                <>{cell.metadata.tokenCount} tokens</>
              )}
              {cell.status === "error" && "Error"}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {cell.type === "prompt" || cell.type === "text" ? (
            <div className="whitespace-pre-wrap">{cell.content}</div>
          ) : cell.type === "response" ? (
            <>
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold mt-4 mb-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-semibold mt-3 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-medium mt-2 mb-1">{children}</h3>,
                  p: ({ children }) => <p className="mb-3">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-6 mb-3">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-6 mb-3">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  code: ({ className, children }) => {
                    const match = /language-(\w+)/.exec(className || '')
                    return match ? (
                      <pre className="bg-muted p-3 rounded-md overflow-x-auto mb-3">
                        <code className={className}>{children}</code>
                      </pre>
                    ) : (
                      <code className="px-1 py-0.5 bg-muted rounded text-sm">{children}</code>
                    )
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic my-3">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {cell.content}
              </ReactMarkdown>
              {cell.status === "streaming" && (
                <span className="inline-block w-2 h-4 bg-foreground/50 animate-pulse ml-1" />
              )}
            </>
          ) : cell.type === "code" ? (
            <pre className="bg-muted p-3 rounded-md overflow-x-auto">
              <code>{cell.content}</code>
            </pre>
          ) : cell.type === "data" ? (
            <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs">
              <code>{cell.content}</code>
            </pre>
          ) : (
            <div>{cell.content}</div>
          )}
        </div>

        {/* Error Display */}
        {cell.status === "error" && cell.error && (
          <div className="mt-3 p-3 bg-destructive/10 rounded-md">
            <p className="text-sm text-destructive">{cell.error}</p>
          </div>
        )}

        {/* Footer */}
        {(cell.status === "complete" || cell.createdAt) && (
          <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {formatDistanceToNow(new Date(cell.createdAt), { addSuffix: true })}
            </span>
            {cell.status === "complete" && cell.metadata?.completedAt && cell.metadata?.startedAt && (
              <span>
                Generated in {Math.round((cell.metadata.completedAt - cell.metadata.startedAt) / 1000)}s
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}