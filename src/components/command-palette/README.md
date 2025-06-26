# Command Palette

A Cmd-K style command palette for quick access to application features.

## Usage

Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux) to open the command palette.

## Features

- **Quick Navigation**: Jump to any page in the app
- **Create Actions**: Create workspaces, stacks, and sources
- **Search**: Find sources and other resources
- **Keyboard Shortcuts**: See shortcuts for each command
- **Feature Flags**: Commands are shown/hidden based on enabled features

## Implementation

The command palette consists of:

1. **CommandPalette**: The main UI component
2. **CommandPaletteProvider**: Manages modal states and actions
3. **Commands**: Static list of available commands
4. **Platform Detection**: Cross-platform keyboard shortcut support

## Adding New Commands

To add a new command, edit `/src/lib/commands/commands.ts`:

```typescript
{
  id: 'my-command',
  title: 'My Command',
  category: 'Actions',
  icon: 'star', // Lucide icon name
  keywords: ['my', 'command', 'keywords'],
  shortcut: { mac: 'cmd+shift+m', windows: 'ctrl+shift+m' },
  enabled: !!workspaceId, // Optional condition
  visible: features.myFeature, // Optional feature flag
  action: () => {
    // Command action
    console.log('Executing my command')
  },
}
```

## Command Categories

- **Navigation**: Moving between pages
- **Create**: Creating new resources
- **Search**: Finding existing resources
- **Actions**: Operations on current context
- **View**: UI toggles and preferences
- **Help**: Documentation and assistance

## Keyboard Navigation

- `↑/↓`: Navigate through commands
- `Enter`: Execute selected command
- `Escape`: Close palette
- Type to search commands

## Feature Flags

Commands can be conditionally shown based on feature flags:

```typescript
visible: features.sources // Only show if sources feature is enabled
```

## Testing

Visit `/test-command-palette` to see a test page with instructions.