"use client";

import { useEffect, useRef, useContext, useCallback } from 'react';
import { KeyboardContext } from './keyboardProvider';
import { UseKeyboardOptions, UseKeyboardResult, KeyboardContextValue, GenericSemanticCommand } from './keyboardTypes';

let componentIdCounter = 0;

type UseKeyboardReturn = UseKeyboardResult & KeyboardContextValue;

/**
 * Unified keyboard hook that provides both keyboard state and focus management
 * 
 * @param options - Optional configuration for keyboard command handling
 * @returns Object containing all keyboard state and focus management methods
 */
export function useKeyboard(options?: UseKeyboardOptions): UseKeyboardReturn {
  const context = useContext(KeyboardContext);
  
  // Generate stable component ID for focus management (always call hooks)
  const componentIdRef = useRef<string | undefined>(undefined);
  if (!componentIdRef.current) {
    componentIdRef.current = `kbd-component-${++componentIdCounter}`;
  }
  const componentId = componentIdRef.current;

  // Store the handler in a ref to avoid re-registering on every render
  const handlerRef = useRef(options?.onKeyboardCommand);
  handlerRef.current = options?.onKeyboardCommand;
  
  // Register/unregister component (always call hooks)
  useEffect(() => {
    if (handlerRef.current) {
      // Create a stable wrapper that always calls the current handler
      const stableHandler = (command: GenericSemanticCommand) => {
        handlerRef.current?.(command);
      };
      
      context?.registerFocusHandler(componentId, stableHandler);
      
      // Request focus on mount if specified
      if (options?.focusOnMount) {
        context?.requestFocus(componentId);
      }

      return () => {
        context?.unregisterFocusHandler(componentId);
      };
    }
  }, [componentId, context, options?.focusOnMount]); // Only depend on focusOnMount, not the whole options object

  if (!context) {
    throw new Error('useKeyboard must be used within KeyboardProvider');
  }

  const hasFocus = options ? context.focusedComponent === componentId : false;
  
  // Create stable wrappers that always use the current context methods
  const requestFocus = useCallback(() => {
    context.requestFocus(componentId);
  }, [context.requestFocus, componentId]);
  
  const releaseFocus = useCallback(() => {
    context.releaseFocus(componentId);
  }, [context.releaseFocus, componentId]);

  return {
    // Only include the methods we need, not the whole context
    setMode: context.setMode,
    focusedComponent: context.focusedComponent,
    registerFocusHandler: context.registerFocusHandler,
    unregisterFocusHandler: context.unregisterFocusHandler,
    hasFocus,
    requestFocus,
    releaseFocus,
    requestPassthrough: context.requestPassthrough,
    releasePassthrough: context.releasePassthrough,
  };
}