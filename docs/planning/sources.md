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
  workspaceId: v.id('workspaces'),
  userId: v.id('users'),
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
.index('by_workspace', ['workspaceId'])
.index('by_user', ['userId'])
.index('by_workspace_name', ['workspaceId', 'name'])
```

## Source Interpolation

Sources can be referenced in prompts and cells using:
- `{{source:name}}` - Reference by name within workspace
- `{{source:#id}}` - Reference by source ID
- For arrays: `{{source:name[0]}}` - Access specific index
- For JSON: `{{source:name.property}}` - Access nested properties

## CRUD Interface Requirements

### List Sources
- Filter by workspace
- Search by name/description
- Filter by type
- Sort by created/updated date

### Create Source
- Name validation (unique per workspace)
- Type-specific validation:
  - String: Plain text editor
  - Array: List editor with add/remove/reorder
  - JSON: JSON editor with validation
- Preview of formatted value

### Update Source
- Rename (with reference update warnings)
- Edit values with type-appropriate editor
- Add/remove tags
- Update description

### Delete Source
- Check for references in cells
- Cascade or prevent deletion options
- Soft delete for recovery

### UI Components Needed
1. Source sidebar/panel in workspace view
2. Source picker modal for prompt editing
3. Source preview cards
4. Inline source editor
5. Reference usage tracker

## Integration Points

### With Stack Operations
- Sources become inputs to LLM operations
- Transform operations can create new sources
- Sources can be pushed directly to stack

### With Prompts
- Prompt templates can reference sources
- Dynamic prompt generation from source arrays
- Context aggregation from multiple sources

### With Keyboard System
- Quick source insertion commands
- Source navigation shortcuts
- Inline source preview on hover

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

1. **API Keys/Configs**: Store as JSON sources for consistent configuration
2. **Prompt Templates**: Reusable prompt snippets as string sources
3. **Test Data**: Arrays of test cases for batch operations
4. **Common Contexts**: Frequently used context snippets
5. **Variable Lists**: Arrays for iteration in stack operations