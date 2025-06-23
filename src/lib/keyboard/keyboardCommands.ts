import { Command, Keymap } from './keyboardTypes'
import {
  stackMoveDown,
  stackMoveUp,
  stackMoveToPosition,
  stackMoveToTop,
  stackMoveToBottom,
  stackEnterVisual,
  stackDelete,
  stackYank,
  stackPaste,
  stackSwap,
  stackRotate
} from './stackCommandDefinitions'

// Re-export stack navigation commands
const moveCellDown = stackMoveDown
const moveCellUp = stackMoveUp
const moveToPosition = stackMoveToPosition
const moveToTop = stackMoveToTop
const moveToBottom = stackMoveToBottom

const enterInsertMode: Command = () => ({
  newKeyboardState: { mode: 'insert' },
  action: () => console.log('Enter insert mode'),
});

const appendMode: Command = () => ({
  newKeyboardState: { mode: 'insert' },
  action: () => console.log('Enter insert mode (append)'),
});

const enterCommandMode: Command = () => ({
  newKeyboardState: { mode: 'command' },
  action: () => console.log('Enter command mode'),
});

const enterVisualMode = stackEnterVisual

const enterSearchMode: Command = () => ({
  action: () => console.log('Enter search mode'),
});

const deleteCell = stackDelete
const yankCell = stackYank

const pasteAfter = stackPaste
const pasteBefore = stackPaste  // TODO: Add before/after distinction

const pushCellBelow: Command = () => ({
  newKeyboardState: { mode: 'insert' },
  action: () => console.log('Push new cell below'),
});

const pushCellAbove: Command = () => ({
  newKeyboardState: { mode: 'insert' },
  action: () => console.log('Push new cell above'),
});

const _nextWorkspace: Command = () => ({
  action: () => console.log('Next workspace'),
});

const _previousWorkspace: Command = () => ({
  action: () => console.log('Previous workspace'),
});

const changeCell: Command = () => ({
  newKeyboardState: { mode: 'insert' },
  action: () => console.log('Change cell (clear and edit)'),
});

const replaceChar: Command = () => ({
  action: () => console.log('Replace character'),
});

const dropCell: Command = () => ({
  action: () => console.log('Drop current cell'),
});

const popStack: Command = () => ({
  action: () => console.log('Pop from stack'),
});

const rotateStack = stackRotate

const swapTop = stackSwap

// Normal mode keymap
export const normalModeKeymap: Keymap = {
  // Navigation
  'j': moveCellDown,
  'k': moveCellUp,
  'g': moveToPosition,      // Handles position: 3g, 5g, etc.
  'gg': moveToBottom,        // Go to bottom (position 1)
  'G': moveToTop,            // Go to top of stack
  
  // Stack operations
  'o': pushCellBelow,
  'O': pushCellAbove,
  'd': {
    'd': deleteCell,
  },
  'x': dropCell,
  'y': {
    'y': yankCell,
  },
  'p': pasteAfter,
  'P': pasteBefore,
  
  // Mode changes
  'i': enterInsertMode,
  'a': appendMode,
  ':': enterCommandMode,
  'v': enterVisualMode,
  '/': enterSearchMode,
  
  // Cell operations
  'c': {
    'c': changeCell,
  },
  'r': replaceChar,
  
  // Direct stack actions
  'u': popStack,
  'R': rotateStack,
  's': swapTop,
}

// Insert mode keymap (minimal - most keys handled by browser)
export const insertModeKeymap: Keymap = {
  '<Escape>': () => ({ newKeyboardState: { mode: 'normal' } }),
}

// Visual mode keymap
export const visualModeKeymap: Keymap = {
  '<Escape>': () => ({ 
    newKeyboardState: { 
      mode: 'normal',
      visualSelection: undefined 
    } 
  }),
  'j': moveCellDown,    // Extends selection down
  'k': moveCellUp,      // Extends selection up
  'G': moveToTop,       // Extend to top
  'gg': moveToBottom,   // Extend to bottom
  'g': moveToPosition,  // Extend to position
  'd': deleteCell,      // Delete selection
  'y': yankCell,        // Yank selection
  'x': deleteCell,      // Delete selection
}

// Command mode keymap (handled differently - these are ex commands)
export const commandModeKeymap: Keymap = {
  '<Escape>': () => ({ newKeyboardState: { mode: 'normal' } }),
}

// Default keymaps for each mode
export const defaultKeymaps: Record<string, Keymap> = {
  normal: normalModeKeymap,
  insert: insertModeKeymap,
  visual: visualModeKeymap,
  command: commandModeKeymap,
}