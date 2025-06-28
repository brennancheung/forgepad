export interface Command {
  id: string
  title: string
  subtitle?: string
  category: string
  icon?: string // Icon name from lucide-react
  keywords: string[]
  shortcut?: {
    mac?: string
    windows?: string
  }
  action: () => void | Promise<void>
  enabled?: boolean
  visible?: boolean
}

export interface CommandContext {
  workspaceId?: string
  stackId?: string
  selectedCells?: string[]
  router: {
    push: (path: string) => void
  }
  features?: {
    sources?: boolean
  }
  actions?: {
    openCreateWorkspace: () => void
    openCreateSource: () => void
    openSourceSearch: () => void
    openSourcePicker: () => void
    setTheme?: (theme: string) => void
  }
}