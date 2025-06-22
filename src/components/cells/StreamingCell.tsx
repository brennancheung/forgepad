'use client'

import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"
import { Id } from "@convex/_generated/dataModel"

interface StreamingCellProps {
  cellId: Id<"cells">
}

export function StreamingCell({ cellId }: StreamingCellProps) {
  const cell = useQuery(api.cells.get, { id: cellId })

  if (!cell) return null

  return (
    <Card className={cn(
      "transition-all duration-200",
      cell.status === "streaming" && "border-primary/50 shadow-lg",
      cell.status === "error" && "border-destructive"
    )}>
      <div className="p-6">
        {/* Status Indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {cell.status === "pending" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Preparing...</span>
              </>
            )}
            {cell.status === "streaming" && (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Generating... ({cell.metadata?.streamedChunks || 0} chunks)</span>
              </>
            )}
            {cell.status === "complete" && (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Complete ({cell.metadata?.tokenCount || 0} tokens)</span>
              </>
            )}
            {cell.status === "error" && (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span>Error</span>
              </>
            )}
          </div>
          
          {cell.metadata?.model && (
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {cell.metadata.model}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{cell.content}</ReactMarkdown>
          
          {/* Streaming cursor */}
          {cell.status === "streaming" && (
            <span className="inline-block w-2 h-4 bg-foreground/50 animate-pulse ml-1" />
          )}
        </div>

        {/* Error Display */}
        {cell.status === "error" && (
          <div className="mt-4 p-4 bg-destructive/10 rounded-md">
            <p className="text-sm text-destructive">{cell.error}</p>
          </div>
        )}

        {/* Metadata Footer */}
        {cell.status === "complete" && cell.metadata?.completedAt && cell.metadata?.startedAt && (
          <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
            Generated in {Math.round((cell.metadata.completedAt - cell.metadata.startedAt) / 1000)}s
          </div>
        )}
      </div>
    </Card>
  )
}