"use client";

import React, { createContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import { 
  KeyboardContextValue, 
  InternalKeyboardState,
  Mode,
  KeyboardAction,
  Keymap,
  Command,
  InteractionContext,
  GenericSemanticCommand
} from './keyboardTypes'
import { 
  formatKey, 
  getInteractionContext, 
  shouldHandleKey,
  parseCommand
} from './keyboardUtils'
import { keyboardReducer, initialState } from './keyboardReducer'
import { processKeyWithStack } from './stackReducer'
import { defaultKeymaps } from './keyboardCommands'
// import { useFocusTracking } from './keyboardFocusTracking'

export const KeyboardContext = createContext<KeyboardContextValue | null>(null);

interface KeyboardProviderProps {
  children: ReactNode;
  keymaps?: Record<string, Keymap>;
}

const KeyboardProviderComponent: React.FC<KeyboardProviderProps> = ({ 
  children,
  keymaps = defaultKeymaps 
}) => {
  // All state in refs - no React state updates
  const internalStateRef = useRef<InternalKeyboardState>(initialState);
  
  // Focus management
  const [focusedComponent, setFocusedComponent] = useState<string | undefined>();
  const componentHandlersRef = useRef<Map<string, (command: GenericSemanticCommand) => void>>(new Map());

  // Focus tracking - removed to improve performance
  // const { focusContext } = useFocusTracking();
  // const focusContextRef = useRef(focusContext);
  // focusContextRef.current = focusContext;
  
  // Cache for interaction context to avoid repeated DOM traversal
  const contextCacheRef = useRef<{
    element: EventTarget | null;
    context: InteractionContext;
  }>({ element: null, context: 'stack-navigation' });

  // Keymaps ref to avoid stale closures
  const keymapsRef = useRef(keymaps);
  keymapsRef.current = keymaps;

  // Stable dispatch function using refs
  const dispatchRef = useRef<((action: KeyboardAction) => void) | undefined>(undefined);
  dispatchRef.current = (action: KeyboardAction) => {
    const currentState = internalStateRef.current;
    const newState = keyboardReducer(currentState, action);
    
    // Update internal state
    internalStateRef.current = newState;
  }

  // Process key with keymap
  const processKeyRef = useRef<((key: string) => void) | undefined>(undefined);
  processKeyRef.current = (key: string) => {
    const currentState = internalStateRef.current;
    const currentKeymap = keymapsRef.current[currentState.mode];
    
    if (!currentKeymap) return;
    
    const oldLastCommand = currentState.lastCommand;
    const newState = processKeyWithStack(currentState, key, currentKeymap);
    
    // Update internal state
    internalStateRef.current = newState;
    
    // Broadcast command buffer changes
    if (newState.commandBuffer !== currentState.commandBuffer) {
      componentHandlersRef.current.forEach((handler) => {
        handler({ type: 'COMMAND_BUFFER_UPDATE', buffer: newState.commandBuffer });
      });
    }
    
    // Check if a command was executed (lastCommand or timestamp changed)
    if ((newState.lastCommand !== oldLastCommand || 
         newState.lastCommandTime !== currentState.lastCommandTime) && 
        newState.lastCommand && currentKeymap) {
      // A command was executed - find it and run its action
      const { command } = resolveKeymapCommand(currentKeymap, newState.lastCommand || '');
      if (command) {
        // Parse the command to extract count
        const parsed = parseCommand(newState.lastCommand || '');
        const context = {
          state: newState,
          count: parsed?.count || 1,
          register: newState.activeRegister || '"',
        }
        const result = command(context);
        
        // Execute action if provided
        if (result.action) {
          result.action();
        }
        
        // Dispatch semantic command to all registered handlers
        // Each component decides whether to respond based on its own focus state
        if (result.semanticCommand) {
          componentHandlersRef.current.forEach((handler) => {
            handler(result.semanticCommand as GenericSemanticCommand);
          });
        }
        
        // If the command resulted in a mode change, update the state
        if (result.newKeyboardState) {
          const updatedState = { ...newState, ...result.newKeyboardState };
          internalStateRef.current = updatedState;
          
          // Broadcast mode changes
          if (result.newKeyboardState.mode && result.newKeyboardState.mode !== newState.mode) {
            const newMode = result.newKeyboardState.mode;
            componentHandlersRef.current.forEach((handler) => {
              handler({ type: 'MODE_CHANGE', mode: newMode });
            });
          }
          
          return;
        }
      }
    }
    
  }

  // Clear context cache on focus changes - removed since we're not tracking focus
  // useEffect(() => {
  //   // Reset cache when focus context changes
  //   contextCacheRef.current = { element: null, context: 'stack-navigation' };
  // }, [focusContext]);
  
  // Register handler ONCE
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const currentState = internalStateRef.current;
      
      // Fast path for insert mode - only handle Escape
      if (currentState.mode === 'insert' && event.key !== 'Escape') {
        return;
      }
      
      // Use cached context if the target element hasn't changed
      let context: InteractionContext;
      if (contextCacheRef.current.element === event.target) {
        context = contextCacheRef.current.context;
      } else {
        // Only perform DOM traversal if target has changed
        context = getInteractionContext(event);
        contextCacheRef.current = {
          element: event.target,
          context: context
        };
      }
      
      if (!shouldHandleKey(event, context, currentState)) {
        return;
      }
      
      // Only prevent default if we're actually handling the key
      event.preventDefault();
      
      const key = formatKey(event);
      processKeyRef.current?.(key);
    }
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty deps - only runs once!

  const value = useMemo(() => ({
    // Focus state
    focusedComponent,
    
    // Stable methods
    setMode: (mode: Mode) => {
      dispatchRef.current?.({ type: 'SET_MODE', mode });
      // Broadcast mode change
      componentHandlersRef.current.forEach((handler) => {
        handler({ type: 'MODE_CHANGE', mode });
      });
    },
    
    // Focus management API
    registerFocusHandler: (id: string, handler: (command: GenericSemanticCommand) => void) => {
      componentHandlersRef.current.set(id, handler);
    },
    unregisterFocusHandler: (id: string) => {
      componentHandlersRef.current.delete(id);
      if (focusedComponent === id) {
        setFocusedComponent(undefined);
      }
    },
    requestFocus: (id: string) => {
      setFocusedComponent(id);
    },
    releaseFocus: (id: string) => {
      if (focusedComponent === id) {
        setFocusedComponent(undefined);
      }
    },
  }), [focusedComponent]);

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
}

export const KeyboardProvider = React.memo(KeyboardProviderComponent);

// Helper to resolve command from keymap
const resolveKeymapCommand = (keymap: Keymap, keys: string): { command?: Command } => {
  // Special handling for special keys like <Escape>, <Enter>, etc.
  if (keys.startsWith('<') && keys.endsWith('>')) {
    const command = keymap[keys];
    if (typeof command === 'function') {
      return { command };
    }
    return {};
  }
  
  // For regular keys, split into parts
  const parts = keys.split('');
  let current: Keymap | Command = keymap;
  
  for (const key of parts) {
    if (typeof current === 'function') return { command: current }
    if (typeof current === 'object' && current[key]) {
      current = current[key];
    } else {
      return {}
    }
  }
  
  if (typeof current === 'function') {
    return { command: current }
  }
  
  return {}
}