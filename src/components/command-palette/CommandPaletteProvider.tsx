'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { CommandPalette } from './CommandPalette'
import { CreateWorkspaceDialog } from '@/components/workspace/CreateWorkspaceDialog'
import { SourcesModal } from '@/components/sources/SourcesModal'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { useRouter } from 'next/navigation'
import { Id } from '@convex/_generated/dataModel'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

interface CommandPaletteContextType {
  openCreateWorkspace: () => void
  openCreateSource: () => void
  openSourceSearch: () => void
  openSourcePicker: () => void
  setTheme?: (theme: string) => void
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined)

export function useCommandPaletteActions() {
  const context = useContext(CommandPaletteContext)
  if (!context) {
    throw new Error('useCommandPaletteActions must be used within CommandPaletteProvider')
  }
  return context
}

interface CommandPaletteProviderProps {
  children: ReactNode
  workspaceId?: string
  stackId?: string
  features?: {
    sources?: boolean
  }
}

export function CommandPaletteProvider({ 
  children, 
  workspaceId, 
  stackId, 
  features 
}: CommandPaletteProviderProps) {
  const router = useRouter()
  const createWorkspace = useMutation(api.workspaces.create)
  const { setTheme } = useTheme()
  
  // Modal states
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false)
  const [sourcesModalOpen, setSourcesModalOpen] = useState(false)
  const [sourcesModalMode, setSourcesModalMode] = useState<'manage' | 'picker'>('manage')
  
  // Actions
  const actions: CommandPaletteContextType = {
    openCreateWorkspace: () => setCreateWorkspaceOpen(true),
    openCreateSource: () => {
      setSourcesModalMode('manage')
      setSourcesModalOpen(prev => !prev)
    },
    openSourceSearch: () => {
      setSourcesModalMode('manage')
      setSourcesModalOpen(true)
    },
    openSourcePicker: () => {
      setSourcesModalMode('picker')
      setSourcesModalOpen(true)
    },
    setTheme,
  }
  
  // Handle workspace creation
  const handleCreateWorkspace = async (name?: string) => {
    const id = await createWorkspace({ name })
    router.push(`/workspace/${id}`)
    setCreateWorkspaceOpen(false)
  }
  
  
  return (
    <CommandPaletteContext.Provider value={actions}>
      {children}
      
      <CommandPalette 
        workspaceId={workspaceId}
        stackId={stackId}
        features={features}
      />
      
      {/* Create Workspace Dialog */}
      <CreateWorkspaceDialog
        open={createWorkspaceOpen}
        onOpenChange={setCreateWorkspaceOpen}
        onCreateWorkspace={handleCreateWorkspace}
      />
      
      {/* Sources Modal */}
      {features?.sources && (
        <SourcesModal
          open={sourcesModalOpen}
          onOpenChange={setSourcesModalOpen}
          workspaceId={workspaceId as Id<'workspaces'> | undefined}
          stackId={stackId as Id<'stacks'> | undefined}
          mode={sourcesModalMode}
          onSelectSource={(source, reference) => {
            // Copy reference to clipboard
            navigator.clipboard.writeText(reference)
            toast.success('Source reference copied to clipboard')
            setSourcesModalOpen(false)
          }}
        />
      )}
    </CommandPaletteContext.Provider>
  )
}