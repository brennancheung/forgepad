import { formatShortcut } from '@/lib/platform'

interface CommandShortcutProps {
  shortcut?: {
    mac?: string
    windows?: string
  }
}

export function CommandShortcut({ shortcut }: CommandShortcutProps) {
  if (!shortcut) return null
  
  const formatted = formatShortcut(shortcut)
  if (!formatted) return null
  
  return (
    <kbd className="ml-auto text-xs text-muted-foreground">
      {formatted}
    </kbd>
  )
}