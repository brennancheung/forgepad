# Sources in Forgepad

## Overview

Sources represent reusable data inputs that can be referenced and interpolated within workspaces. They provide a way to define and manage static data that can be used across multiple stacks and operations.

## Source Types (Current Focus)

### Literal Sources
- **String**: Plain text values (prompts, templates, snippets)
- **Array**: Lists of values that can be iterated over
- **JSON**: Structured data objects for complex configurations

*Note: Conversation sources and other dynamic source types will be addressed in a future iteration.*

## Current State Analysis

### What We Have
- **Stacks**: Named collections of computational items
- **Cells**: Individual items with types (text, prompt, response, etc.)
- **Operations**: Audit trail of stack manipulations
- **Prompts**: Named prompt templates (already exists)

### What's Missing
- No way to store and reference reusable data values
- No mechanism for structured data that isn't a prompt
- No array/list management for batch operations

## Proposed Source Schema

```typescript
sources: defineTable({
  // Scope fields - userId is required, others optional
  userId: v.id('users'),  // Always required - owner of the source
  workspaceId: v.optional(v.id('workspaces')),  // For workspace-scoped sources
  stackId: v.optional(v.id('stacks')),  // For stack-scoped sources
  
  name: v.string(),
  description: v.optional(v.string()),
  type: v.union(
    v.literal('string'),
    v.literal('array'),
    v.literal('json'),
  ),
  
  // The actual value - type depends on 'type' field
  value: v.any(), // Will be validated based on type
  
  // Metadata
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

## Source Scopes

Sources can exist at three levels, with cascading visibility:

1. **User-level sources**: Available across all workspaces and stacks for the user
2. **Workspace-level sources**: Available within a specific workspace and its stacks
3. **Stack-level sources**: Available only within a specific stack

### Scope Rules
- `userId` is always required (identifies the owner)
- If `stackId` is set, `workspaceId` must also be set (stacks exist within workspaces)
- Names must be unique within their scope level

### Resolution Order
When resolving `{{source:name}}`, the system searches in order:
1. Stack-level sources (if in a stack context)
2. Workspace-level sources (if in a workspace context)
3. User-level sources

This allows for scope-specific overrides while maintaining access to broader sources.

## Source Interpolation

Sources can be referenced in prompts and cells using:
- `{{source:name}}` - Reference by name (follows resolution order)
- `{{user:name}}` - Explicitly reference user-level source
- `{{workspace:name}}` - Explicitly reference workspace-level source
- `{{stack:name}}` - Explicitly reference stack-level source

## CRUD Interface Requirements

**Important**: Source management will be implemented as embeddable widget-style components, not full pages. This enables flexible integration at user, workspace, and stack scopes with both UI and programmatic access.

### List Sources Widget
- Filter by scope (user/workspace/stack)
- Show sources from all accessible scopes
- Search by name/description
- Filter by type
- Sort by created/updated date
- Visual indicators for scope level
- Embeddable in sidebars, panels, and modals

### Create Source Widget
- Scope selector (user/workspace/stack)
- Name validation (unique within selected scope)
- Type-specific validation:
  - String: Plain text editor
  - Array: List editor with add/remove/reorder
  - JSON: JSON editor with validation
- Preview of formatted value
- Clear indication of where source will be available
- Quick-add mode for streamlined creation

### Update Source Widget
- Rename (with reference update warnings)
- Edit values with type-appropriate editor
- Add/remove tags
- Update description
- Inline or modal editing modes

### Delete Source
- Check for references in cells
- Cascade or prevent deletion options
- Soft delete for recovery
- Batch operations support

### Widget Components Needed
1. SourceListWidget - Embeddable source list/grid
2. SourceQuickAddWidget - Minimal creation interface
3. SourceEditorWidget - Full editing capabilities
4. SourcePickerWidget - Searchable source selector
5. SourceContextMenuWidget - Action menu for sources

### Programmatic Access
- Hotkey triggers sources manager
- Command interface for add/remove from scope

See `sources-widgets.md` for detailed widget specifications.

## Integration Points

### With Stack Operations
- Sources become inputs to LLM operations
- Transform operations can create new sources
- Sources can be pushed directly to stack
- Stack-level sources for operation-specific data

### With Prompts
- Prompt templates can reference sources at any scope
- Dynamic prompt generation from source arrays
- Context aggregation from multiple sources
- Scope-aware interpolation

### With Keyboard System
- Quick source insertion commands
- Source navigation shortcuts with scope indicators
- Inline source preview on hover
- Scope-specific creation shortcuts

## Open Questions

1. **Source Versioning**: Should sources track changes over time?
no

2. **Access Control**: Should sources have sharing/visibility settings beyond workspace?
no

3. **Source Composition**: Should sources be able to reference other sources?
no

4. **Performance**: How to efficiently interpolate sources in prompts?
n/a

5. **Storage Limits**: Should we limit source sizes or counts per workspace?
no

6. **Type Validation**: How strict should type validation be for arrays/JSON?

## Next Steps

1. Implement source schema in Convex
2. Create source CRUD functions (create, read, update, delete, list)
3. Build source management UI components:
   - Source list/grid view
   - Source editor modal
   - Type-specific value editors
4. Implement source interpolation in prompt system
5. Add keyboard shortcuts for source operations
6. Create source usage tracking
7. Add import/export functionality for sources

## Benefits

- **Reusability**: Define data once, reference everywhere
- **Consistency**: Same values across all operations
- **Organization**: Centralized data management per workspace
- **Flexibility**: Support for strings, arrays, and JSON structures
- **Efficiency**: Reduce duplication in prompts and cells

## Example Use Cases

### User-Level Sources
1. **API Keys**: Personal API keys available across all workspaces
2. **Personal Templates**: Commonly used prompt patterns
3. **User Preferences**: JSON configs for personal settings

### Workspace-Level Sources
1. **Project Context**: Shared context for all stacks in a project
2. **Team Templates**: Workspace-specific prompt templates
3. **Test Data Sets**: Shared test data for the workspace

### Stack-Level Sources
1. **Operation Variables**: Temporary values for stack operations
2. **Iteration Data**: Arrays specific to current processing
3. **Local Configs**: Stack-specific configurations