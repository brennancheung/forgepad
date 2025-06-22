# Workspaces Design

## Overview
Workspaces are interactive scratch pads that serve as namespaces/contexts for different tasks or projects. Users can switch between them to organize their work.

## Core Functionality

### 1. Workspace Management
- **List View**: Show all workspaces in sidebar
- **Create**: New workspace with auto-generated or custom name
- **Rename**: Edit workspace name inline
- **Delete**: Remove workspace (with confirmation)
- **Switch**: Click to activate workspace

### 2. UI Layout
```
+------------------+--------------------------------+
|                  |                                |
|   Workspace      |      Workspace Content         |
|   Sidebar        |                                |
|                  |   [Placeholder: Shows name]    |
| - Work Project   |                                |
| - Personal       |       "Work Project"           |
| - Research       |                                |
| - [+ New]        |                                |
|                  |                                |
+------------------+--------------------------------+
```

### 3. Sidebar Component Features
- **Active Indicator**: Highlight current workspace
- **Keyboard Navigation**: 
  - `Ctrl+K W` - Open workspace switcher
  - Number keys `1-9` - Quick switch to workspace N
  - `n` - New workspace
  - `r` - Rename current
  - `d` - Delete current
- **Search/Filter**: Fuzzy find for many workspaces
- **Drag to Reorder**: Optional, but keyboard shortcuts preferred

### 4. Data Model (Already in Schema)
```typescript
workspaces: defineTable({
  name: v.string(),
  userId: v.id('users'),
  isDefault: v.optional(v.boolean()),
  order: v.optional(v.number()),
})
.index('by_user', ['userId'])
.index('by_user_and_name', ['userId', 'name'])
```

## Implementation Plan

### Phase 1: Basic CRUD
1. Create workspace sidebar component
2. Implement Convex functions:
   - `listWorkspaces` - Get all for current user
   - `createWorkspace` - With name generation
   - `renameWorkspace` - Update name
   - `deleteWorkspace` - With cascade delete of contents
   - `setActiveWorkspace` - Track current workspace

### Phase 2: UI Polish
1. Inline editing for rename
2. Confirmation dialog for delete
3. Loading states
4. Error handling
5. Empty state (no workspaces)

### Phase 3: Keyboard Support
1. Global hotkeys for switching
2. Command palette integration
3. Vim-style navigation in sidebar

## Component Structure
```
components/
  workspace/
    WorkspaceSidebar.tsx      # Main sidebar container
    WorkspaceList.tsx         # List of workspaces
    WorkspaceItem.tsx         # Individual workspace entry
    CreateWorkspaceDialog.tsx # New workspace form
    WorkspaceContent.tsx      # Right-side content area
```

## State Management
- **Active Workspace**: Store in context or Zustand
- **Optimistic Updates**: For snappy UI
- **Real-time Sync**: Via Convex subscriptions

## Design Decisions

### 1. Default Workspace
- Auto-create "Default" workspace for new users
- Cannot delete last workspace
- Mark one workspace as default (optional)

### 2. Workspace Names
- Unique per user (enforced by index)
- Sensible defaults: "Workspace 1", "Workspace 2"
- Or creative: "Cosmic Sandbox", "Quantum Lab"
- Max length: 50 characters

### 3. Deletion Behavior
- Soft delete vs hard delete?
- What happens to stacks/cells in deleted workspace?
- Show warning about data loss

### 4. Switching Behavior
- Save current state before switching?
- Restore last view when returning?
- Animation/transition between workspaces?

## Questions to Resolve

1. **Persistence**: Should we remember which workspace was last active?
Maybe later. Not sure.

2. **Sharing**: Will workspaces ever be shareable/collaborative?
Decide later. Not sure.

3. **Templates**: Pre-configured workspace templates?
No.

4. **Export**: Ability to export/import workspaces?
No.

5. **Limits**: Max workspaces per user?
Not for now.

6. **Icons/Colors**: Visual differentiation between workspaces?
Future enhancement.

## Next Steps
1. Build basic sidebar component
2. Implement CRUD operations in Convex
3. Add keyboard shortcuts
4. Test with placeholder content
5. Iterate based on usage