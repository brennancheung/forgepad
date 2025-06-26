# Sources Widget Components

## Overview

Sources in Forgepad need to be accessible through embeddable widget-style components rather than full pages. This enables seamless integration at user, workspace, and stack scopes while maintaining flexibility for both UI-based and programmatic access.

## Widget Design Philosophy

### Core Principles
- **Embeddable**: Components can be dropped into any context (sidebars, modals, panels)
- **Self-contained**: Each widget manages its own state and interactions
- **Scope-aware**: Automatically adapts to the current scope context
- **Keyboard-accessible**: Full functionality without mouse interaction
- **Programmatically invokable**: Can be triggered via hotkeys or commands without UI

### Widget Types

#### 1. Source List Widget
**Component**: `<SourceListWidget />`

**Features**:
- Compact, filterable list view
- Scope indicator badges (U/W/S)
- Type icons for quick identification
- Inline actions (edit, delete, duplicate)
- Search/filter bar
- Collapsible sections by scope
- Empty state with quick create action

**Embedding Locations**:
- Workspace sidebar panel
- Stack sidebar drawer
- User settings page (future)
- Floating command palette

**Behavior**:
- Auto-filters to current scope by default
- Shows inherited sources from parent scopes
- Supports multi-select for batch operations
- Keyboard navigation with j/k movement

#### 2. Source Quick Add Widget
**Component**: `<SourceQuickAddWidget />`

**Features**:
- Minimal form with smart defaults
- Type selector (string/array/json)
- Name input with live validation
- Quick value input area
- Scope auto-detection based on context
- "Add & Continue" option

**Embedding Locations**:
- Floating modal triggered by hotkey
- Inline in source list widget
- Context menu in editor
- Command palette action

**Behavior**:
- Focuses name input on mount
- Validates uniqueness in real-time
- Suggests scope based on current context
- Dismisses on escape or successful add

#### 3. Source Editor Widget
**Component**: `<SourceEditorWidget />`

**Features**:
- Type-specific editors (string/array/json)
- Live preview pane
- Scope selector/indicator
- Tag management
- Usage references display
- Save/cancel/delete actions

**Embedding Locations**:
- Modal overlay
- Side panel drawer
- Split view in workspace
- Inline expansion in list

**Behavior**:
- Auto-saves on blur (optional)
- Warns on unsaved changes
- Shows validation errors inline
- Supports keyboard shortcuts for save/cancel

#### 4. Source Picker Widget
**Component**: `<SourcePickerWidget />`

**Features**:
- Searchable dropdown/combobox
- Grouped by scope with visual hierarchy
- Type indicators
- Preview on hover
- Recent sources section
- Create new option

**Embedding Locations**:
- Inline in text editors
- Cell configuration panels
- Prompt template editors
- Variable insertion points

**Behavior**:
- Filters as you type
- Shows resolution order
- Keyboard navigable
- Returns source reference syntax

#### 5. Source Context Menu Widget
**Component**: `<SourceContextMenuWidget />`

**Features**:
- Compact action menu
- Edit, duplicate, delete options
- Move to different scope
- Copy reference syntax
- View usage

**Embedding Locations**:
- Right-click on source items
- Three-dot menu in lists
- Long-press on mobile

**Behavior**:
- Positions intelligently
- Dismisses on action or click outside
- Keyboard accessible

## Scope-Specific Implementations

### User Scope
- Accessed via user settings (future)
- Available in all workspaces
- Special "global" indicator
- No workspace/stack context required

### Workspace Scope
- Primary access in workspace sidebar
- Shows user sources as inherited
- Default scope for most operations
- Bulk import/export tools

### Stack Scope
- Embedded in stack view
- Shows workspace + user sources
- Temporary/experimental sources
- Quick toggle to promote to workspace

## Programmatic Access

### Hotkey Triggers
```typescript
// Global hotkeys
'ctrl+s': () => openSourcePicker()

## Visual Design

### Layout Patterns
- **Sidebar Panel**: 300px wide, full height, collapsible
- **Modal Overlay**: 600px max width, centered, backdrop
- **Inline Widget**: Expands in place, pushes content
- **Floating Widget**: Positioned near trigger, dismissible

### Visual Hierarchy
1. Scope badges: Colored indicators (U=blue, W=green, S=orange)
2. Type icons: Distinct shapes for string/array/json
3. Inherited sources: Slightly muted appearance
4. Active source: Highlighted border/background
