'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { PromptSearchModal } from '@/components/prompts/PromptSearchModal'

interface PromptModalContextType {
  openPromptSearch: (onInsert: (content: string) => void) => void
}

const PromptModalContext = createContext<PromptModalContextType | undefined>(undefined)

export function PromptModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [insertCallback, setInsertCallback] = useState<((content: string) => void) | null>(null)

  const openPromptSearch = useCallback((onInsert: (content: string) => void) => {
    setInsertCallback(() => onInsert)
    setIsOpen(true)
  }, [])

  const handleInsert = useCallback((content: string) => {
    if (insertCallback) {
      insertCallback(content)
    }
  }, [insertCallback])

  return (
    <PromptModalContext.Provider value={{ openPromptSearch }}>
      {children}
      <PromptSearchModal
        open={isOpen}
        onOpenChange={setIsOpen}
        onInsert={handleInsert}
      />
    </PromptModalContext.Provider>
  )
}

export function usePromptModal() {
  const context = useContext(PromptModalContext)
  if (!context) {
    throw new Error('usePromptModal must be used within a PromptModalProvider')
  }
  return context
}