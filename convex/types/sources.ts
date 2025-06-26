import { Id } from '../_generated/dataModel'

export type SourceType = 'string' | 'array' | 'json'
export type SourceScope = 'user' | 'workspace' | 'stack'

export type SourceValue = string | unknown[] | Record<string, unknown>

export interface Source {
  _id: Id<'sources'>
  _creationTime: number
  userId: Id<'users'>
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
  name: string
  description?: string
  type: SourceType
  value: SourceValue
  tags?: string[]
  createdAt: number
  updatedAt: number
}

export function getSourceScope(source: Source): SourceScope {
  if (source.stackId) return 'stack'
  if (source.workspaceId) return 'workspace'
  return 'user'
}

export interface SourceResolutionContext {
  userId: Id<'users'>
  workspaceId?: Id<'workspaces'>
  stackId?: Id<'stacks'>
}

export function getResolutionOrder(context: SourceResolutionContext): SourceScope[] {
  const order: SourceScope[] = []
  if (context.stackId) order.push('stack')
  if (context.workspaceId) order.push('workspace')
  order.push('user')
  return order
}