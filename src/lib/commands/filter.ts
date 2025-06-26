import { Command } from './types'

export function filterCommands(commands: Command[], search: string): Command[] {
  if (!search) return commands
  
  const searchLower = search.toLowerCase()
  
  return commands
    .filter(cmd => {
      // Match on title, keywords, category
      const titleMatch = cmd.title.toLowerCase().includes(searchLower)
      const keywordMatch = cmd.keywords.some(k => k.toLowerCase().includes(searchLower))
      const categoryMatch = cmd.category.toLowerCase().includes(searchLower)
      return titleMatch || keywordMatch || categoryMatch
    })
    .sort((a, b) => {
      // Prioritize exact matches, then title matches, then keyword matches
      const aExact = a.title.toLowerCase() === searchLower
      const bExact = b.title.toLowerCase() === searchLower
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      
      const aTitle = a.title.toLowerCase().includes(searchLower)
      const bTitle = b.title.toLowerCase().includes(searchLower)
      if (aTitle && !bTitle) return -1
      if (!aTitle && bTitle) return 1
      
      return 0
    })
}

export function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const group = String(item[key])
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {} as Record<string, T[]>)
}