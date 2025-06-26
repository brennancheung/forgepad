import { toast } from 'sonner'
import { Source, SourceType, SourceScope } from '@convex/types/sources'
import { Id } from '@convex/_generated/dataModel'

export interface SourceWidgetManager {
  openPicker: (options: PickerOptions) => void
  openQuickAdd: (options: QuickAddOptions) => void
  openEditor: (sourceId: Id<'sources'> | Source) => void
  addToScope: (sourceIds: Id<'sources'>[], scope: ScopeOptions) => Promise<void>
  removeFromScope: (sourceIds: Id<'sources'>[], scope: ScopeOptions) => Promise<void>
  toggleSourceSidebar: () => void
}

interface PickerOptions {
  onSelect: (source: Source, reference: string) => void
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
  filter?: {
    type?: SourceType
    scope?: SourceScope
  }
}

interface QuickAddOptions {
  type?: SourceType
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
  onComplete?: (sourceId: Id<'sources'>) => void
}

interface ScopeOptions {
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
}

// Global state for widget management
let widgetManager: SourceWidgetManager | null = null
let sidebarVisible = false

// Event system for widget communication
export const sourceEvents = new EventTarget()

export const SourceWidgetEvents = {
  OPEN_PICKER: 'source:open-picker',
  OPEN_QUICK_ADD: 'source:open-quick-add',
  OPEN_EDITOR: 'source:open-editor',
  TOGGLE_SIDEBAR: 'source:toggle-sidebar',
  SOURCE_CREATED: 'source:created',
  SOURCE_UPDATED: 'source:updated',
  SOURCE_DELETED: 'source:deleted',
} as const

// Initialize the widget manager
export function initSourceWidgetManager(manager: SourceWidgetManager) {
  widgetManager = manager
}

// Get the current widget manager
export function getSourceWidgetManager(): SourceWidgetManager {
  if (!widgetManager) {
    throw new Error('Source widget manager not initialized')
  }
  return widgetManager
}

// Programmatic API functions
export async function openSourcePicker(options: PickerOptions) {
  sourceEvents.dispatchEvent(new CustomEvent(SourceWidgetEvents.OPEN_PICKER, { detail: options }))
}

export async function quickAddSource(options: QuickAddOptions = {}) {
  sourceEvents.dispatchEvent(new CustomEvent(SourceWidgetEvents.OPEN_QUICK_ADD, { detail: options }))
}

export async function editSource(sourceId: Id<'sources'> | Source) {
  sourceEvents.dispatchEvent(new CustomEvent(SourceWidgetEvents.OPEN_EDITOR, { detail: sourceId }))
}

export function toggleSourceSidebar() {
  sidebarVisible = !sidebarVisible
  sourceEvents.dispatchEvent(new CustomEvent(SourceWidgetEvents.TOGGLE_SIDEBAR, { detail: sidebarVisible }))
}

// Batch operations
export async function addSourcesToScope(
  sourceIds: Id<'sources'>[],
  scope: ScopeOptions,
  moveSource: (args: { id: Id<'sources'>; newWorkspaceId?: Id<'workspaces'>; newStackId?: Id<'stacks'> }) => Promise<unknown>
) {
  try {
    const promises = sourceIds.map(id => 
      moveSource({
        id,
        newWorkspaceId: scope.workspaceId,
        newStackId: scope.stackId,
      })
    )
    
    await Promise.all(promises)
    
    const scopeName = scope.stackId ? 'stack' : scope.workspaceId ? 'workspace' : 'user'
    toast.success(`Added ${sourceIds.length} source(s) to ${scopeName} scope`)
  } catch (error) {
    toast.error('Failed to add sources to scope')
    throw error
  }
}

export async function removeSourcesFromScope(
  sourceIds: Id<'sources'>[],
  moveSource: (args: { id: Id<'sources'>; newWorkspaceId?: Id<'workspaces'>; newStackId?: Id<'stacks'> }) => Promise<unknown>
) {
  try {
    const promises = sourceIds.map(id => 
      moveSource({
        id,
        newWorkspaceId: undefined,
        newStackId: undefined,
      })
    )
    
    await Promise.all(promises)
    
    toast.success(`Moved ${sourceIds.length} source(s) to user scope`)
  } catch (error) {
    toast.error('Failed to remove sources from scope')
    throw error
  }
}

// Helper to insert source reference at cursor
export function insertSourceReference(
  source: Source,
  scope?: SourceScope,
  element?: HTMLTextAreaElement | HTMLInputElement
) {
  const actualScope = scope || getSourceScope(source)
  const reference = actualScope === 'user' 
    ? `{{source:${source.name}}}`
    : `{{${actualScope}:${source.name}}}`
  
  if (element) {
    const start = element.selectionStart || 0
    const end = element.selectionEnd || 0
    const text = element.value
    const before = text.substring(0, start)
    const after = text.substring(end)
    
    element.value = before + reference + after
    element.setSelectionRange(start + reference.length, start + reference.length)
    element.focus()
    
    // Trigger input event for React
    const event = new Event('input', { bubbles: true })
    element.dispatchEvent(event)
  } else {
    // Copy to clipboard as fallback
    navigator.clipboard.writeText(reference)
    toast.success('Source reference copied to clipboard')
  }
}

// Helper to get source scope
function getSourceScope(source: Source): SourceScope {
  if (source.stackId) return 'stack'
  if (source.workspaceId) return 'workspace'
  return 'user'
}