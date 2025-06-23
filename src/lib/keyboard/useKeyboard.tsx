"use client";

import { useEffect, useRef, useContext } from 'react';
import { KeyboardContext } from './keyboardProvider';
import { UseKeyboardOptions, UseKeyboardResult, KeyboardContextValue } from './keyboardTypes';

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

  // Register/unregister component (always call hooks)
  useEffect(() => {
    if (options?.onKeyboardCommand) {
      context?.registerFocusHandler(componentId, options.onKeyboardCommand);
      
      // Request focus on mount if specified
      if (options.focusOnMount) {
        context?.requestFocus(componentId);
      }

      return () => {
        context?.unregisterFocusHandler(componentId);
      };
    }
  }, [componentId, context, options]);

  if (!context) {
    throw new Error('useKeyboard must be used within KeyboardProvider');
  }

  const hasFocus = options ? context.focusedComponent === componentId : false;

  return {
    ...context,
    hasFocus,
    requestFocus: () => context.requestFocus(componentId),
    releaseFocus: () => context.releaseFocus(componentId),
  };
}