# Source Widget Components

This directory contains embeddable widget components for managing sources in Forgepad.

## Available Widgets

### SourceListWidget

A comprehensive list view for sources with filtering, sorting, and search capabilities.

```tsx
<SourceListWidget
  workspaceId={workspaceId}
  stackId={stackId}
  showInherited={true}
  onEdit={(source) => handleEdit(source)}
  onQuickAdd={() => setShowQuickAdd(true)}
  onSelect={(source) => handleSelect(source)}
  className="h-[400px]"
  maxHeight="400px"
/>
```

### SourceQuickAddWidget

A minimal form for quickly creating new sources.

```tsx
<SourceQuickAddWidget
  workspaceId={workspaceId}
  stackId={stackId}
  defaultType="string"
  onComplete={(sourceId) => handleComplete(sourceId)}
  onCancel={() => handleCancel()}
  autoFocus={true}
/>
```

## Usage Examples

### In a Sidebar

```tsx
import { SourceListWidget } from '@/components/sources/widgets'

function WorkspaceSidebar() {
  return (
    <aside className="w-80 border-r">
      <SourceListWidget
        workspaceId={currentWorkspaceId}
        showInherited={true}
        maxHeight="calc(100vh - 200px)"
      />
    </aside>
  )
}
```

### In a Modal/Sheet

```tsx
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { SourceQuickAddWidget } from '@/components/sources/widgets'

function SourceModal({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SourceQuickAddWidget
          workspaceId={workspaceId}
          onComplete={(id) => {
            console.log('Created:', id)
            onOpenChange(false)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}
```

### Programmatic Access

The widgets are designed to be controlled programmatically:

```tsx
// Open source picker
const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 's' && e.ctrlKey) {
    openSourcePicker()
  }
}

// Add to scope without UI
const addSourceToWorkspace = async (sourceId: string) => {
  await moveSource({
    id: sourceId,
    workspaceId: currentWorkspaceId,
  })
}
```

## Planned Widgets

- **SourceEditorWidget**: Full editing capabilities for existing sources
- **SourcePickerWidget**: Searchable dropdown for inserting source references
- **SourceContextMenuWidget**: Right-click menu for source actions

## Integration Points

These widgets are designed to be embedded in:
- Workspace sidebars
- Stack panels
- Modal dialogs
- Floating panels
- Command palettes
- Editor toolbars