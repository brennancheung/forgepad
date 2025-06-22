import { KeyCategory, InteractionContext, InternalKeyboardState, ParsedCommand } from './keyboardTypes'

// Format a keyboard event into a standardized key string
export const formatKey = (event: KeyboardEvent): string => {
  const modifiers = [];
  if (event.ctrlKey || event.metaKey) modifiers.push('C-');
  if (event.altKey) modifiers.push('A-');
  if (event.shiftKey && event.key.length > 1) modifiers.push('S-');
  
  const key = event.key.length === 1 ? event.key : `<${event.key}>`;
  return modifiers.join('') + key;
}

// Categorize a key for context-aware filtering
export const categorizeKey = (event: KeyboardEvent): KeyCategory => {
  const key = formatKey(event);
  
  if (key === '<Escape>') return 'escape';
  if (key === '<Enter>' || key === 'C-<Enter>') return 'submit';
  if (key.includes('C-') || key.includes('A-')) return 'meta';
  
  // Single character navigation keys
  if ('jkhlggG'.includes(key) && key.length === 1) return 'navigation';
  if ('iaocrdxyp'.includes(key) && key.length === 1) return 'editing';
  
  return 'text-input';
}

// Check if an element is an input element
export const isInputElement = (element: HTMLElement): boolean => {
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.contentEditable === 'true'
  );
}

// Get the interaction context from a keyboard event
export const getInteractionContext = (event: KeyboardEvent): InteractionContext => {
  const target = event.target as HTMLElement;
  
  // Priority order (highest to lowest)
  const contexts: Array<{ selector: string; context: InteractionContext }> = [
    { selector: '[role="dialog"]', context: 'modal-dialog' },
    { selector: '[data-role="command-input"]', context: 'command-input' },
    { selector: '[data-role="search-input"]', context: 'search-input' },
    { selector: '[data-role="widget-input"]', context: 'widget-interaction' },
    { selector: '[data-role="cell-editor"]', context: 'cell-editing' },
  ];
  
  for (const { selector, context } of contexts) {
    if (target.closest(selector)) return context;
  }
  
  // Check for general inputs
  if (isInputElement(target)) {
    const closestCell = target.closest('[data-cell-id]');
    if (closestCell) return 'cell-editing';
  }
  
  return 'stack-navigation';
}

// Determine if a key should be handled based on context
export const shouldHandleKey = (
  event: KeyboardEvent,
  context: InteractionContext,
  keyboardState: InternalKeyboardState
): boolean => {
  const category = categorizeKey(event);
  
  switch (context) {
    case 'cell-editing':
      // In cell editing, only handle escape and submit keys
      return category === 'escape' || 
             (category === 'submit' && event.ctrlKey);
    
    case 'command-input':
    case 'search-input':
      // In command/search, handle escape and submit
      return category === 'escape' || category === 'submit';
    
    case 'widget-interaction':
      // In widgets, handle escape and meta keys
      return category === 'escape' || category === 'meta';
    
    case 'modal-dialog':
      // In modals, only handle escape
      return category === 'escape';
    
    case 'stack-navigation':
      // In navigation, handle everything except text input
      // (unless we're building a command like "3j")
      if (keyboardState.commandBuffer && /^\d+$/.test(keyboardState.commandBuffer)) {
        // Allow numbers to continue count prefix
        return true;
      }
      return category !== 'text-input';
    
    default:
      return true;
  }
}

// Parse a command buffer into its components
export const parseCommand = (buffer: string): ParsedCommand | null => {
  if (!buffer) return null;
  
  const countMatch = buffer.match(/^(\d+)/);
  const count = countMatch ? parseInt(countMatch[1]) : null;
  const remaining = count && countMatch ? buffer.slice(countMatch[1].length) : buffer;
  
  // For now, simple parsing - can be extended later
  return {
    count,
    operator: null, // TODO: extract operators like d, y, c
    motion: remaining || null,
    raw: buffer
  }
}

// Extract UI state from internal state
export const extractUIState = (internal: InternalKeyboardState) => ({
  mode: internal.mode,
  commandBuffer: internal.commandBuffer,
  isRecordingCommand: internal.commandBuffer.length > 0,
});

// Check if UI state needs updating
export const shouldUpdateUI = (
  oldState: InternalKeyboardState,
  newState: InternalKeyboardState
): boolean => {
  return (
    oldState.mode !== newState.mode ||
    oldState.commandBuffer !== newState.commandBuffer
  );
}