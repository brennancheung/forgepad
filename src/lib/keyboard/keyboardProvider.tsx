"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import { 
  KeyboardContextValue, 
  InternalKeyboardState, 
  UIKeyboardState,
  Mode,
  KeyboardAction,
  Keymap,
  Command,
  InteractionContext
} from './keyboardTypes'
import { 
  formatKey, 
  getInteractionContext, 
  shouldHandleKey,
  extractUIState,
  shouldUpdateUI,
  parseCommand
} from './keyboardUtils'
import { keyboardReducer, processKeyWithKeymap, initialState } from './keyboardReducer'
import { defaultKeymaps } from './keyboardCommands'
import { useFocusTracking } from './keyboardFocusTracking'

const KeyboardContext = createContext<KeyboardContextValue | null>(null);

export const useKeyboard = () => {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboard must be used within KeyboardProvider');
  }
  return context;
}

interface KeyboardProviderProps {
  children: ReactNode;
  keymaps?: Record<string, Keymap>;
}

export const KeyboardProvider: React.FC<KeyboardProviderProps> = ({ 
  children,
  keymaps = defaultKeymaps 
}) => {
  // UI state - only what components need to render
  const [uiState, setUiState] = useState<UIKeyboardState>(() => 
    extractUIState(initialState)
  );

  // Internal state - doesn't trigger re-renders
  const internalStateRef = useRef<InternalKeyboardState>(initialState);

  // Focus tracking
  const { focusContext } = useFocusTracking();
  const focusContextRef = useRef(focusContext);
  focusContextRef.current = focusContext;
  
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
    
    // Only update React state if UI-relevant properties changed
    if (shouldUpdateUI(currentState, newState)) {
      setUiState(extractUIState(newState));
    }
  }

  // Process key with keymap
  const processKeyRef = useRef<((key: string) => void) | undefined>(undefined);
  processKeyRef.current = (key: string) => {
    const currentState = internalStateRef.current;
    const currentKeymap = keymapsRef.current[currentState.mode];
    
    if (!currentKeymap) return;
    
    const oldLastCommand = currentState.lastCommand;
    const newState = processKeyWithKeymap(currentState, key, currentKeymap);
    
    // Update internal state
    internalStateRef.current = newState;
    
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
        if (result.action) {
          result.action();
        }
        
        // If the command resulted in a mode change, update the state
        if (result.newKeyboardState) {
          const updatedState = { ...newState, ...result.newKeyboardState };
          internalStateRef.current = updatedState;
          setUiState(extractUIState(updatedState));
          return;
        }
      }
    }
    
    // Update UI if needed
    if (shouldUpdateUI(currentState, newState)) {
      setUiState(extractUIState(newState));
    }
  }

  // Clear context cache on focus changes
  useEffect(() => {
    // Reset cache when focus context changes
    contextCacheRef.current = { element: null, context: 'stack-navigation' };
  }, [focusContext]);
  
  // Register handler ONCE
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
      
      const currentState = internalStateRef.current;
      
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
    // UI state
    mode: uiState.mode,
    commandBuffer: uiState.commandBuffer,
    isRecordingCommand: uiState.isRecordingCommand,
    interactionContext: focusContext,
    
    // Stable methods
    setMode: (mode: Mode) => {
      dispatchRef.current?.({ type: 'SET_MODE', mode });
    },
    executeCommand: (command: string) => {
      dispatchRef.current?.({ type: 'EXECUTE_COMMAND', command });
    },
  }), [uiState, focusContext]);

  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
}

// Helper to resolve command from keymap
const resolveKeymapCommand = (keymap: Keymap, keys: string): { command?: Command } => {
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