import { Command, CommandContext } from './types'

export function getCommands(context: CommandContext): Command[] {
  const { workspaceId, stackId, router, features = {}, actions } = context
  
  const commands: Command[] = [
    // Navigation Commands
    {
      id: 'go-home',
      title: 'Go to Home',
      category: 'Navigation',
      icon: 'home',
      keywords: ['home', 'dashboard', 'start'],
      action: () => router.push('/'),
    },
    {
      id: 'go-workspace',
      title: 'Go to Current Workspace',
      category: 'Navigation',
      icon: 'folder',
      keywords: ['workspace', 'current'],
      enabled: !!workspaceId,
      action: () => router.push(`/workspace/${workspaceId}`),
    },
    {
      id: 'go-settings',
      title: 'Go to Settings',
      category: 'Navigation', 
      icon: 'settings',
      keywords: ['settings', 'preferences', 'config'],
      shortcut: { mac: 'cmd+,', windows: 'ctrl+,' },
      action: () => router.push('/settings'),
    },
    
    // Create Commands
    {
      id: 'new-workspace',
      title: 'Create New Workspace',
      category: 'Create',
      icon: 'folder-plus',
      keywords: ['new', 'workspace', 'create', 'add'],
      shortcut: { mac: 'cmd+shift+n', windows: 'ctrl+shift+n' },
      action: () => {
        actions?.openCreateWorkspace()
      },
    },
    {
      id: 'new-stack',
      title: 'Create New Stack',
      category: 'Create',
      icon: 'layers',
      keywords: ['new', 'stack', 'create', 'add'],
      enabled: !!workspaceId,
      action: async () => {
        // TODO: Create stack in current workspace
        console.log('Create stack in workspace:', workspaceId)
      },
    },
    
    // Source Commands (feature flagged)
    ...(features.sources ? [
      {
        id: 'manage-sources',
        title: 'Manage Sources',
        category: 'Actions',
        icon: 'database',
        keywords: ['sources', 'variables', 'data', 'manage', 'crud'],
        shortcut: { mac: 'cmd+s', windows: 'ctrl+s' },
        subtitle: 'Create, edit, and delete sources',
        action: () => {
          actions?.openCreateSource()
        },
      },
      {
        id: 'insert-source-reference',
        title: 'Insert Source Reference',
        category: 'Actions',
        icon: 'link',
        keywords: ['insert', 'source', 'reference', 'interpolate', 'variable'],
        shortcut: { mac: 'cmd+shift+s', windows: 'ctrl+shift+s' },
        subtitle: 'Pick a source to insert its reference',
        enabled: !!workspaceId,
        action: () => {
          actions?.openSourcePicker()
        },
      },
    ] : []),
    
    // Stack Actions
    {
      id: 'clear-stack',
      title: 'Clear Current Stack',
      category: 'Actions',
      icon: 'trash-2',
      keywords: ['clear', 'delete', 'empty', 'stack'],
      enabled: !!stackId,
      action: async () => {
        // TODO: Clear stack
        console.log('Clear stack:', stackId)
      },
    },
    {
      id: 'run-stack',
      title: 'Run Stack',
      category: 'Actions',
      icon: 'play',
      keywords: ['run', 'execute', 'stack'],
      enabled: !!stackId,
      shortcut: { mac: 'cmd+enter', windows: 'ctrl+enter' },
      action: async () => {
        // TODO: Run stack
        console.log('Run stack:', stackId)
      },
    },
    
    // View Commands
    {
      id: 'toggle-sidebar',
      title: 'Toggle Sidebar',
      category: 'View',
      icon: 'panel-left',
      keywords: ['sidebar', 'toggle', 'hide', 'show', 'panel'],
      shortcut: { mac: 'cmd+b', windows: 'ctrl+b' },
      action: () => {
        // TODO: Toggle sidebar
        console.log('Toggle sidebar')
      },
    },
    {
      id: 'toggle-dark-mode',
      title: 'Toggle Dark Mode',
      category: 'View',
      icon: 'moon',
      keywords: ['dark', 'light', 'theme', 'mode', 'toggle'],
      action: () => {
        // TODO: Toggle dark mode
        console.log('Toggle dark mode')
      },
    },
    
    // Demo Commands
    ...(workspaceId ? [
      {
        id: 'interpolation-demo',
        title: 'Source Interpolation Demo',
        category: 'Demos',
        icon: 'code',
        keywords: ['demo', 'interpolation', 'sources', 'test'],
        action: () => router.push(`/workspace/${workspaceId}/interpolation-demo`),
      },
    ] : []),
    
    // Help Commands
    {
      id: 'show-shortcuts',
      title: 'Show Keyboard Shortcuts',
      category: 'Help',
      icon: 'keyboard',
      keywords: ['keyboard', 'shortcuts', 'keys', 'help'],
      shortcut: { mac: 'cmd+/', windows: 'ctrl+/' },
      action: () => {
        // TODO: Show shortcuts modal
        console.log('Show shortcuts')
      },
    },
    {
      id: 'open-docs',
      title: 'Open Documentation',
      category: 'Help',
      icon: 'book-open',
      keywords: ['docs', 'documentation', 'help', 'guide'],
      action: () => {
        window.open('https://docs.forgepad.ai', '_blank')
      },
    },
  ]
  
  // Filter out commands with visible: false
  return commands.filter(cmd => cmd.visible !== false)
}