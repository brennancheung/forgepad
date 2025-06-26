# Sources Implementation Plan

## Overview

This document outlines the phased implementation of the Sources feature for Forgepad. Based on the planning document and open questions answered, we'll implement literal sources (string, array, JSON) without versioning, access control beyond workspaces, or source composition.

## Phase 1: Database Schema & Core CRUD Functions

### 1.1 Update Convex Schema
**File**: `/convex/schema.ts`

Add sources table:
```typescript
sources: defineTable({
  // Scope fields
  userId: v.id('users'), // Always required - owner
  workspaceId: v.optional(v.id('workspaces')), // Workspace scope
  stackId: v.optional(v.id('stacks')), // Stack scope
  
  name: v.string(),
  description: v.optional(v.string()),
  type: v.union(
    v.literal('string'),
    v.literal('array'),
    v.literal('json'),
  ),
  value: v.any(), // Runtime validation based on type
  tags: v.optional(v.array(v.string())),
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index('by_user', ['userId'])
.index('by_workspace', ['workspaceId'])
.index('by_stack', ['stackId'])
.index('by_user_name', ['userId', 'name'])
.index('by_workspace_name', ['workspaceId', 'name'])
.index('by_stack_name', ['stackId', 'name'])
```

### 1.2 Create Validation Helpers
**File**: `/convex/sources/validation.ts`

```typescript
export function validateSourceValue(type: SourceType, value: any): boolean
export function sanitizeSourceValue(type: SourceType, value: any): any
export function getSourceValueError(type: SourceType, value: any): string | null
export function validateSourceScope(userId: Id<'users'>, workspaceId?: Id<'workspaces'>, stackId?: Id<'stacks'>): boolean
export function validateSourceName(name: string, scope: SourceScope): boolean
```

### 1.3 Implement CRUD Functions
**Files**: `/convex/sources/mutations.ts` and `/convex/sources/queries.ts`

Mutations:
- `createSource` - Create new source with scope validation
- `updateSource` - Update existing source
- `deleteSource` - Delete source (check for references)
- `duplicateSource` - Create copy with new name/scope
- `moveSource` - Change source scope (user->workspace, etc)

Queries:
- `getSource` - Get single source by ID
- `getSourceByName` - Get source by name with scope resolution
- `listSources` - List sources accessible in current context
- `listUserSources` - List user-level sources
- `listWorkspaceSources` - List workspace-level sources
- `listStackSources` - List stack-level sources
- `searchSources` - Full-text search across accessible sources
- `getSourceReferences` - Find cells referencing a source
- `resolveSourceName` - Resolve name following scope hierarchy

### 1.4 Add Source Types
**File**: `/convex/types/sources.ts`

```typescript
export type SourceType = 'string' | 'array' | 'json'
export type SourceScope = 'user' | 'workspace' | 'stack'

export interface Source {
  _id: Id<'sources'>
  userId: Id<'users'>
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
  name: string
  description?: string
  type: SourceType
  value: any
  tags?: string[]
  createdAt: number
  updatedAt: number
}

export function getSourceScope(source: Source): SourceScope {
  if (source.stackId) return 'stack'
  if (source.workspaceId) return 'workspace'
  return 'user'
}
```

## Phase 2: Widget Components

### 2.1 Source List Widget
**File**: `/src/components/sources/widgets/SourceListWidget.tsx`

Features:
- Embeddable component (not a page)
- Compact list/grid view toggle
- Scope filter badges (All, User, Workspace, Stack)
- Type filter buttons
- Inline search input
- Sort dropdown (name, date, type, scope)
- Empty state per scope with quick-add
- Loading skeleton
- Scope indicators on each source
- Keyboard navigation support
- Auto-adapts to container size

### 2.2 Source Quick Add Widget
**File**: `/src/components/sources/widgets/SourceQuickAddWidget.tsx`

Features:
- Minimal floating form
- Auto-detect scope from context
- Name input with live validation
- Type selector
- Quick value input
- Save & Continue option
- Escape to dismiss
- Programmatically invokable

### 2.3 Source Card Component
**File**: `/src/components/sources/SourceCard.tsx`

Display:
- Source name and type icon
- Scope badge (U/W/S)
- Description preview
- Value preview (truncated)
- Tags
- Last updated timestamp
- Inline actions (edit/delete/duplicate)
- Usage count indicator
- Hover preview

### 2.4 Source Type Icons
**File**: `/src/components/sources/SourceTypeIcon.tsx`

Icons for:
- String (text icon)
- Array (list icon)
- JSON (code/braces icon)

### 2.5 Widget Container Components
**File**: `/src/components/sources/containers/`

- `SourceSidebarPanel.tsx` - Workspace sidebar integration
- `SourceModalWrapper.tsx` - Modal container for widgets
- `SourceFloatingPanel.tsx` - Floating/dropdown container
- `SourceInlineExpander.tsx` - Inline expansion container

## Phase 3: Source Editors

### 3.1 Source Editor Widget
**File**: `/src/components/sources/widgets/SourceEditorWidget.tsx`

Common features:
- Embeddable in modal or panel
- Scope selector/indicator
- Name input with scope-aware validation
- Description textarea
- Type selector (for new sources)
- Tags input
- Save/cancel buttons
- Delete confirmation
- Move to different scope option
- Keyboard shortcuts (Cmd+S to save)
- Can be used inline or in overlay

### 3.2 String Source Editor
**File**: `/src/components/sources/editors/StringEditor.tsx`

Features:
- Textarea with syntax highlighting (optional)
- Character count
- Line numbers (optional)
- Preview mode

### 3.3 Array Source Editor
**File**: `/src/components/sources/editors/ArrayEditor.tsx`

Features:
- List of items with drag-to-reorder
- Add item button
- Delete item buttons
- Item type validation
- Bulk operations (clear, sort)
- Import from clipboard

### 3.4 JSON Source Editor
**File**: `/src/components/sources/editors/JsonEditor.tsx`

Features:
- JSON syntax highlighting
- Format/prettify button
- Validation errors display
- Tree view toggle
- Import/export buttons

### 3.5 Source Preview Component
**File**: `/src/components/sources/SourcePreview.tsx`

Render formatted preview based on type:
- String: First N lines with "show more"
- Array: List items with count
- JSON: Pretty-printed with syntax highlighting

### 3.6 Source Picker Widget
**File**: `/src/components/sources/widgets/SourcePickerWidget.tsx`

Features:
- Searchable combobox UI
- Grouped by scope with hierarchy
- Type indicators and previews
- Recent sources section
- "Create new" option
- Returns source reference syntax
- Keyboard navigable

## Phase 4: Source Interpolation System

### 4.1 Interpolation Parser
**File**: `/src/lib/sources/interpolation.ts`

Functions:
- `parseSourceReferences(text: string): SourceReference[]`
- `interpolateSources(text: string, sources: Map<string, Source>): string`
- `validateSourceReference(ref: SourceReference): boolean`

Reference patterns:
- `{{source:name}}` - By name (scope resolution)
- `{{source:#id}}` - By ID
- `{{user:name}}` - User-level source
- `{{workspace:name}}` - Workspace-level source
- `{{stack:name}}` - Stack-level source
- `{{source:name[0]}}` - Array index
- `{{source:name.prop}}` - JSON property

### 4.2 Source Resolution
**File**: `/src/lib/sources/resolution.ts`

Functions:
- `resolveSourceByName(name: string, context: ResolutionContext): Source | null`
- `resolveSourceValue(source: Source, path?: string): any`
- `resolveArrayIndex(array: any[], index: number): any`
- `resolveJsonPath(json: any, path: string): any`
- `getResolutionOrder(context: ResolutionContext): SourceScope[]`

ResolutionContext includes:
- userId: Current user
- workspaceId?: Current workspace
- stackId?: Current stack

### 4.3 Integration with Cells
**File**: `/src/lib/cells/preprocessing.ts`

- Modify cell content processing to interpolate sources
- Cache resolved sources for performance
- Handle missing source errors gracefully

### 4.4 Source Reference Tracking
**File**: `/convex/sources/references.ts`

Functions:
- `updateCellSourceReferences` - Track which cells use which sources
- `getSourceUsage` - Get cells using a specific source
- `validateSourceDeletion` - Check if source can be safely deleted

## Phase 5: Keyboard Integration

### 5.1 Source Commands
**File**: `/src/lib/keyboard/commands/sources.ts`

Commands:
- `:source list` - Toggle source list widget
- `:source create [type]` - Open quick add widget
- `:source edit [name]` - Open editor widget
- `:source insert [name]` - Open picker widget
- `:source add-to-scope [name] [scope]` - Programmatic add
- `:source remove-from-scope [name] [scope]` - Programmatic remove

### 5.2 Normal Mode Shortcuts
Update keyboard mappings:
- `gs` - Toggle source sidebar
- `@s` - Open source picker widget
- `]s` / `[s` - Next/previous source reference
- `cmd+shift+s` - Quick add source
- `cmd+alt+s` - Source picker

### 5.3 Source Completion
**File**: `/src/components/editor/SourceAutocomplete.tsx`

Features:
- Trigger on `{{source:`, `{{user:`, `{{workspace:`, `{{stack:`
- Show matching sources with scope indicators
- Group by scope in dropdown
- Preview on hover
- Tab/enter to complete
- Show resolution order hint

### 5.4 Programmatic Widget API
**File**: `/src/lib/sources/widget-api.ts`

API functions:
- `openSourcePicker(options)` - Open picker programmatically
- `quickAddSource(type, scope)` - Open quick add
- `editSource(sourceId)` - Open editor
- `addToScope(sourceIds, scope)` - Batch add to scope
- `removeFromScope(sourceIds, scope)` - Batch remove
- `toggleSourceSidebar()` - Show/hide sidebar

## Phase 6: Advanced Features

### 6.1 Source Import/Export
**File**: `/src/lib/sources/import-export.ts`

Features:
- Export sources as JSON
- Import from JSON with validation
- Conflict resolution (duplicate names)
- Bulk operations

### 6.2 Source Templates
**File**: `/src/components/sources/templates/`

Pre-built templates:
- Common prompt patterns
- Configuration objects
- Test data arrays
- API request templates

### 6.3 Source Analytics
**File**: `/src/components/sources/SourceAnalytics.tsx`

Track and display:
- Usage frequency by scope
- Last used date
- Referenced by N cells
- Unused sources by scope
- Scope distribution chart
- Name collision warnings

### 6.4 Batch Operations
**File**: `/src/components/sources/BatchOperations.tsx`

Operations:
- Select multiple sources
- Bulk delete
- Bulk tag management
- Bulk export

## Phase 7: Testing & Polish

### 7.1 Unit Tests
- Validation functions
- Interpolation parser
- CRUD operations
- Source resolution

### 7.2 Integration Tests
- Source creation flow
- Interpolation in cells
- Reference tracking
- Deletion with references

### 7.3 E2E Tests
- Complete source workflow
- Keyboard navigation
- Error handling
- Performance with many sources

### 7.4 Performance Optimization
- Implement source caching
- Optimize interpolation for large texts
- Lazy load source lists
- Virtualize long lists

## Implementation Order

1. **Week 1**: Phase 1 (Database & CRUD)
2. **Week 2**: Phase 2 (Widget Components) + Phase 3 (Editors)
3. **Week 3**: Phase 4 (Interpolation)
4. **Week 4**: Phase 5 (Keyboard & Programmatic API) + Phase 6 (Advanced)
5. **Week 5**: Phase 7 (Testing & Polish)

### Widget Implementation Priority
1. **Core Widgets**: SourceListWidget, SourceQuickAddWidget
2. **Editor Widget**: SourceEditorWidget with type editors
3. **Utility Widgets**: SourcePickerWidget, ContextMenuWidget
4. **Integration**: Sidebar panels, modal wrappers
5. **Programmatic API**: Widget control functions

## Technical Decisions

### State Management
- Use Convex real-time queries for source data
- Local state for widget UI interactions
- Widget-specific context providers
- Global widget manager for coordination
- Optimistic updates for better UX
- Context-aware source loading based on current scope

### Validation Strategy
- Client-side validation for immediate feedback
- Server-side validation as source of truth
- Type-specific validation rules
- Scope-aware name uniqueness validation
- Stack scope requires workspace scope validation

### Performance Considerations
- Index sources by all scope combinations
- Cache interpolated values per render
- Lazy load sources by scope
- Debounce source search/filter
- Paginate large source lists
- Efficient scope resolution with memoization

### Error Handling
- Graceful fallbacks for missing sources
- Clear error messages for invalid references
- Scope conflict resolution UI
- Validation errors in widget editors
- Network error recovery
- Clear messaging for scope-related errors
- Widget-level error boundaries
- Toast notifications for async operations

## Success Metrics

1. Sources can be created, edited, and deleted via widgets
2. Sources can be referenced in cells and prompts
3. All source types (string, array, JSON) work correctly
4. Widgets are embeddable in multiple contexts
5. Keyboard shortcuts and programmatic API work seamlessly
6. Performance remains good with 100+ sources
7. No data loss or corruption
8. Clear error messages for all failure cases
9. Widget components are reusable and maintainable
10. User can manage sources without leaving their current context