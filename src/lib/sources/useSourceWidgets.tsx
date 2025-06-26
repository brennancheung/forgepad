'use client'

import { useEffect, useState, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import {
  sourceEvents,
  SourceWidgetEvents,
  openSourcePicker,
  quickAddSource,
  editSource,
  toggleSourceSidebar,
  addSourcesToScope,
  removeSourcesFromScope,
  insertSourceReference,
} from './widget-api'
import { Source } from '@convex/types/sources'
import { Id } from '@convex/_generated/dataModel'

export function useSourceWidgets() {
  const [sidebarVisible, setSidebarVisible] = useState(false)
  const moveSource = useMutation(api.sources.mutations.moveSource)

  useEffect(() => {
    const handleToggleSidebar = (e: Event) => {
      const event = e as CustomEvent<boolean>
      setSidebarVisible(event.detail)
    }

    sourceEvents.addEventListener(SourceWidgetEvents.TOGGLE_SIDEBAR, handleToggleSidebar)
    
    return () => {
      sourceEvents.removeEventListener(SourceWidgetEvents.TOGGLE_SIDEBAR, handleToggleSidebar)
    }
  }, [])

  const addToScope = useCallback(
    async (sourceIds: Id<'sources'>[], workspaceId?: Id<'workspaces'>, stackId?: Id<'stacks'>) => {
      await addSourcesToScope(sourceIds, { workspaceId, stackId }, moveSource)
    },
    [moveSource]
  )

  const removeFromScope = useCallback(
    async (sourceIds: Id<'sources'>[]) => {
      await removeSourcesFromScope(sourceIds, moveSource)
    },
    [moveSource]
  )

  const insertReference = useCallback(
    (source: Source, element?: HTMLTextAreaElement | HTMLInputElement) => {
      insertSourceReference(source, undefined, element)
    },
    []
  )

  return {
    sidebarVisible,
    openPicker: openSourcePicker,
    quickAdd: quickAddSource,
    edit: editSource,
    toggleSidebar: toggleSourceSidebar,
    addToScope,
    removeFromScope,
    insertReference,
  }
}