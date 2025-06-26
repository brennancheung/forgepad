# Sources Implementation Status

## Overview

Sources in Forgepad are like variables in a programming language - they provide a symbol table where values can be stored and referenced. They follow hierarchical scoping rules similar to nested scopes in programming languages:

- **User-level sources**: Global to the user, available everywhere
- **Workspace-level sources**: Available within that workspace and its stacks
- **Stack-level sources**: Local to that specific stack

Sources must have programmatic names (letters, numbers, underscore, starting with letter or underscore) and can store values that are yanked from cells or manually entered.

## Completed Phases

### Phase 1: Database Schema & Core CRUD Functions ✅
- Created Convex schema with hierarchical scoping (user → workspace → stack)
- Implemented validation helpers for source types (string, array, json)
- Created CRUD functions (create, update, delete, move, duplicate)
- Added query functions with proper filtering

### Phase 2: Basic UI Components ✅
- Created source widget components:
  - `SourceListWidget` - Display sources with filtering/sorting
  - `SourcePickerWidget` - Select sources with search
  - `SourceQuickAddWidget` - Quick creation form
  - `SourceEditorWidget` - Full editor with type-specific editors
- Implemented widget API for programmatic control
- Added source type icons and scope badges

### Phase 3: Source Editors ✅
- Built type-specific editors:
  - String editor with multiline support
  - Array editor with add/remove/reorder
  - JSON editor with syntax highlighting and validation
- Integrated editors into SourceEditorWidget

### Phase 4: Source Interpolation System ✅
- Implemented parser for source references: `{{source:name}}`, `{{user:name}}`, etc.
- Added array/object path support: `{{source:array[0]}}`, `{{source:object.property}}`
- Created `useSourceInterpolation` hook for React components
- Built `InterpolatedCell` and `InterpolationPreview` components
- Fixed authentication to use Clerk properly

## Current Architecture

### How Sources Work
1. **Scoping**: Sources are scoped hierarchically
   - User-level sources: Available everywhere for that user
   - Workspace-level sources: Available in that workspace and its stacks
   - Stack-level sources: Available only in that specific stack

2. **Interpolation**: Sources can be referenced in text using double-brace syntax
   - Simple: `{{source:apiKey}}`
   - Scoped: `{{workspace:config}}`, `{{stack:prompt}}`
   - Paths: `{{source:data[0].name}}`

3. **Integration Points**:
   - Command palette actions for creating and searching sources
   - Source picker widget for inserting references
   - Interpolation in cells and prompts
   - Widget API for programmatic control

## Next Steps

### Phase 5: Sources Modal ✅ (Partially Complete)
The sources modal is launched from the command palette and provides:
- List of all sources with scoping visualization
- CRUD operations (create, read, update, delete, rename)
- Source picker for inserting references
- Quick add functionality

**Status**: Modal infrastructure is in place, but needs the actual source management UI integrated.

### Integration Points Clarified:
1. **Sources are accessed via modal** launched from command palette
2. **Source references** can be inserted via the source picker
3. **Interpolation** happens when cells/prompts are evaluated
4. **No keyboard shortcuts** - just command palette integration

### Phase 6: Advanced Features (Pending)
- Import/export sources
- Source templates
- Analytics and usage tracking
- Batch operations
- Source versioning/history

### Phase 7: Testing & Polish (Pending)
- Unit tests for all source operations
- Integration tests for interpolation
- E2E tests for user workflows
- Performance optimization for large source sets

## Implementation Notes

### Key Files Created
- `/convex/sources/` - All backend source operations
- `/convex/types/sources.ts` - TypeScript types
- `/src/components/sources/` - All UI components
- `/src/lib/sources/` - Client-side logic and interpolation
- `/src/hooks/useSourceInterpolation.ts` - React hook for interpolation
- `/src/components/cells/InterpolatedCell.tsx` - Cell component with interpolation

### Design Decisions
1. Used functional programming approach (no OOP)
2. Integrated with existing Clerk authentication
3. Built reusable widget components
4. Created event-based widget API for loose coupling
5. Made interpolation opt-in via hooks/components