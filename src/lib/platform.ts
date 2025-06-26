export function getPlatform(): 'mac' | 'windows' | 'linux' {
  if (typeof window === 'undefined') return 'mac'
  
  const platform = window.navigator.platform.toLowerCase()
  if (platform.includes('mac')) return 'mac'
  if (platform.includes('win')) return 'windows'
  return 'linux'
}

export function getModifierKey(): 'cmd' | 'ctrl' {
  return getPlatform() === 'mac' ? 'cmd' : 'ctrl'
}

export function formatShortcut(shortcut: { mac?: string; windows?: string } | undefined): string {
  if (!shortcut) return ''
  
  const platform = getPlatform()
  const key = platform === 'mac' ? shortcut.mac : (shortcut.windows || shortcut.mac)
  
  if (!key) return ''
  
  // Convert to symbols for Mac
  if (platform === 'mac') {
    return key
      .replace(/cmd/gi, '⌘')
      .replace(/ctrl/gi, '⌃')
      .replace(/shift/gi, '⇧')
      .replace(/alt|opt/gi, '⌥')
      .replace(/enter|return/gi, '⏎')
      .replace(/\+/g, '')
  }
  
  // Capitalize for Windows/Linux
  return key
    .replace(/cmd/gi, 'Ctrl')
    .replace(/ctrl/gi, 'Ctrl')
    .replace(/shift/gi, 'Shift')
    .replace(/alt/gi, 'Alt')
    .replace(/enter|return/gi, 'Enter')
    .split('+')
    .map(part => part.trim())
    .join('+')
}