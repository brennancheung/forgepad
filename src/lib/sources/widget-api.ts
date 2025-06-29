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
export const initSourceWidgetManager = (manager: SourceWidgetManager): void => {
  widgetManager = manager
}

// Get the current widget manager
export const getSourceWidgetManager = (): SourceWidgetManager => {
  if (!widgetManager) throw new Error('Source widget manager not initialized')
  return widgetManager
}

// Programmatic API functions
export const openSourcePicker = async (options: PickerOptions): Promise<void> => {
  sourceEvents.dispatchEvent(new CustomEvent(SourceWidgetEvents.OPEN_PICKER, { detail: options }))
}

export const quickAddSource = async (options: QuickAddOptions = {}): Promise<void> => {
  sourceEvents.dispatchEvent(new CustomEvent(SourceWidgetEvents.OPEN_QUICK_ADD, { detail: options }))
}

export const editSource = async (sourceId: Id<'sources'> | Source): Promise<void> => {
  sourceEvents.dispatchEvent(new CustomEvent(SourceWidgetEvents.OPEN_EDITOR, { detail: sourceId }))
}

export const toggleSourceSidebar = (): void => {
  sidebarVisible = !sidebarVisible
  sourceEvents.dispatchEvent(new CustomEvent(SourceWidgetEvents.TOGGLE_SIDEBAR, { detail: sidebarVisible }))
}

// Get scope name from options
const getScopeName = (scope: ScopeOptions): string => {
  if (scope.stackId) return 'stack'
  if (scope.workspaceId) return 'workspace'
  return 'user'
}

// Move multiple sources to scope
const moveSourcesToScope = (
  sourceIds: Id<'sources'>[],
  scope: ScopeOptions,
  moveSource: (args: { id: Id<'sources'>; newWorkspaceId?: Id<'workspaces'>; newStackId?: Id<'stacks'> }) => Promise<unknown>
): Promise<unknown[]> => {
  const promises = sourceIds.map(id => 
    moveSource({
      id,
      newWorkspaceId: scope.workspaceId,
      newStackId: scope.stackId,
    })
  )
  return Promise.all(promises)
}

// Batch operations
export const addSourcesToScope = async (
  sourceIds: Id<'sources'>[],
  scope: ScopeOptions,
  moveSource: (args: { id: Id<'sources'>; newWorkspaceId?: Id<'workspaces'>; newStackId?: Id<'stacks'> }) => Promise<unknown>
): Promise<void> => {
  try {
    await moveSourcesToScope(sourceIds, scope, moveSource)
    const scopeName = getScopeName(scope)
    toast.success(`Added ${sourceIds.length} source(s) to ${scopeName} scope`)
  } catch (error) {
    toast.error('Failed to add sources to scope')
    throw error
  }
}

export const removeSourcesFromScope = async (
  sourceIds: Id<'sources'>[],
  moveSource: (args: { id: Id<'sources'>; newWorkspaceId?: Id<'workspaces'>; newStackId?: Id<'stacks'> }) => Promise<unknown>
): Promise<void> => {
  try {
    await moveSourcesToScope(sourceIds, { workspaceId: undefined, stackId: undefined }, moveSource)
    toast.success(`Moved ${sourceIds.length} source(s) to user scope`)
  } catch (error) {
    toast.error('Failed to remove sources from scope')
    throw error
  }
}

// Helper to get source scope
const getSourceScope = (source: Source): SourceScope => {
  if (source.stackId) return 'stack'
  if (source.workspaceId) return 'workspace'
  return 'user'
}

// Build source reference string
const buildSourceReference = (source: Source, scope?: SourceScope): string => {
  const actualScope = scope || getSourceScope(source)
  return actualScope === 'user' 
    ? `{{source:${source.name}}}`
    : `{{${actualScope}:${source.name}}}`
}

// Insert text at cursor position
const insertTextAtCursor = (
  element: HTMLTextAreaElement | HTMLInputElement,
  text: string
): void => {
  const start = element.selectionStart || 0
  const end = element.selectionEnd || 0
  const value = element.value
  const before = value.substring(0, start)
  const after = value.substring(end)
  
  element.value = before + text + after
  element.setSelectionRange(start + text.length, start + text.length)
  element.focus()
  
  // Trigger input event for React
  const event = new Event('input', { bubbles: true })
  element.dispatchEvent(event)
}

// Copy reference to clipboard
const copyReferenceToClipboard = async (reference: string): Promise<void> => {
  await navigator.clipboard.writeText(reference)
  toast.success('Source reference copied to clipboard')
}

// Helper to insert source reference at cursor
export const insertSourceReference = (
  source: Source,
  scope?: SourceScope,
  element?: HTMLTextAreaElement | HTMLInputElement
): void => {
  const reference = buildSourceReference(source, scope)
  
  if (element) {
    insertTextAtCursor(element, reference)
    return
  }
  
  copyReferenceToClipboard(reference)
}

