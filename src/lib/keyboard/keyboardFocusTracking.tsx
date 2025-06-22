"use client";

import { useState, useEffect } from 'react';
import { InteractionContext } from './keyboardTypes'
import { getInteractionContext } from './keyboardUtils'

export const useFocusTracking = () => {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);
  const [focusContext, setFocusContext] = useState<InteractionContext>('stack-navigation');
  
  useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      setFocusedElement(target);
      // Create a minimal event-like object for context detection
      const mockEvent = { target } as unknown as KeyboardEvent;
      setFocusContext(getInteractionContext(mockEvent));
    }
    
    const handleBlur = (_event: FocusEvent) => {
      // Delay to see if focus moves to another element
      setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) {
          setFocusedElement(null);
          setFocusContext('stack-navigation');
        }
      }, 0);
    }
    
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    
    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    }
  }, []);
  
  return { focusedElement, focusContext }
}