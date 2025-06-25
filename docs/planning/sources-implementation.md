# Sources Implementation Plan

## Overview

This document outlines the phased implementation of the Sources feature for Forgepad. Based on the planning document and open questions answered, we'll implement literal sources (string, array, JSON) without versioning, access control beyond workspaces, or source composition.

## Phase 1: Database Schema & Core CRUD Functions

### 1.1 Update Convex Schema
**File**: `/convex/schema.ts`

Add sources table:
```typescript
sources: defineTable({
  workspaceId: v.id('workspaces'),
  userId: v.id('users'),
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
.index('by_workspace', ['workspaceId'])
.index('by_user', ['userId'])
.index('by_workspace_name', ['workspaceId', 'name'])
```

### 1.2 Create Validation Helpers
**File**: `/convex/sources/validation.ts`

```typescript
export function validateSourceValue(type: SourceType, value: any): boolean
export function sanitizeSourceValue(type: SourceType, value: any): any
export function getSourceValueError(type: SourceType, value: any): string | null
```

### 1.3 Implement CRUD Functions
**Files**: `/convex/sources/mutations.ts` and `/convex/sources/queries.ts`

Mutations:
- `createSource` - Create new source with validation
- `updateSource` - Update existing source
- `deleteSource` - Delete source (check for references)
- `duplicateSource` - Create copy with new name

Queries:
- `getSource` - Get single source by ID
- `getSourceByName` - Get source by workspace + name
- `listSources` - List sources with filtering/sorting
- `searchSources` - Full-text search sources
- `getSourceReferences` - Find cells referencing a source

### 1.4 Add Source Types
**File**: `/convex/types/sources.ts`

```typescript
export type SourceType = 'string' | 'array' | 'json'
export interface Source {
  _id: Id<'sources'>
  workspaceId: Id<'workspaces'>
  userId: Id<'users'>
  name: string
  description?: string
  type: SourceType
  value: any
  tags?: string[]
  createdAt: number
  updatedAt: number
}
```

## Phase 2: Basic UI Components

### 2.1 Source List Component
**File**: `/src/components/sources/SourceList.tsx`

Features:
- Grid/list view toggle
- Type filter buttons
- Search input
- Sort options (name, date, type)
- Empty state
- Loading state

### 2.2 Source Card Component
**File**: `/src/components/sources/SourceCard.tsx`

Display:
- Source name and type icon
- Description preview
- Value preview (truncated)
- Tags
- Last updated timestamp
- Edit/delete actions

### 2.3 Source Type Icons
**File**: `/src/components/sources/SourceTypeIcon.tsx`

Icons for:
- String (text icon)
- Array (list icon)
- JSON (code/braces icon)

### 2.4 Basic Source Manager Page
**File**: `/src/app/(authenticated)/workspace/[workspaceId]/sources/page.tsx`

Layout:
- Header with "Sources" title and create button
- Search/filter bar
- Source list/grid
- Integration with workspace layout

## Phase 3: Source Editors

### 3.1 Source Editor Modal
**File**: `/src/components/sources/SourceEditorModal.tsx`

Common features:
- Name input with validation
- Description textarea
- Type selector (for new sources)
- Tags input
- Save/cancel buttons
- Delete confirmation

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

## Phase 4: Source Interpolation System

### 4.1 Interpolation Parser
**File**: `/src/lib/sources/interpolation.ts`

Functions:
- `parseSourceReferences(text: string): SourceReference[]`
- `interpolateSources(text: string, sources: Map<string, Source>): string`
- `validateSourceReference(ref: SourceReference): boolean`

Reference patterns:
- `{{source:name}}` - By name
- `{{source:#id}}` - By ID
- `{{source:name[0]}}` - Array index
- `{{source:name.prop}}` - JSON property

### 4.2 Source Resolution
**File**: `/src/lib/sources/resolution.ts`

Functions:
- `resolveSourceValue(source: Source, path?: string): any`
- `resolveArrayIndex(array: any[], index: number): any`
- `resolveJsonPath(json: any, path: string): any`

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
- `:source list` - Open source manager
- `:source create [type]` - Create new source
- `:source edit [name]` - Edit existing source
- `:source insert [name]` - Insert source reference at cursor

### 5.2 Normal Mode Shortcuts
Update keyboard mappings:
- `gs` - Go to sources
- `@s` - Quick source insert menu
- `]s` / `[s` - Next/previous source reference

### 5.3 Source Completion
**File**: `/src/components/editor/SourceAutocomplete.tsx`

Features:
- Trigger on `{{source:`
- Show matching sources
- Preview on hover
- Tab/enter to complete

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
- Usage frequency
- Last used date
- Referenced by N cells
- Unused sources

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
2. **Week 2**: Phase 2 (Basic UI) + Phase 3 (Editors)
3. **Week 3**: Phase 4 (Interpolation)
4. **Week 4**: Phase 5 (Keyboard) + Phase 6 (Advanced)
5. **Week 5**: Phase 7 (Testing & Polish)

## Technical Decisions

### State Management
- Use Convex real-time queries for source lists
- Local state only for editor modals
- Optimistic updates for better UX

### Validation Strategy
- Client-side validation for immediate feedback
- Server-side validation as source of truth
- Type-specific validation rules

### Performance Considerations
- Index sources by workspace and name
- Cache interpolated values per render
- Debounce source search/filter
- Paginate large source lists

### Error Handling
- Graceful fallbacks for missing sources
- Clear error messages for invalid references
- Validation errors in editors
- Network error recovery

## Success Metrics

1. Sources can be created, edited, and deleted
2. Sources can be referenced in cells and prompts
3. All source types (string, array, JSON) work correctly
4. Keyboard shortcuts improve workflow
5. Performance remains good with 100+ sources
6. No data loss or corruption
7. Clear error messages for all failure cases