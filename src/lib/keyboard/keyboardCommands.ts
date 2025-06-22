import { Command, Keymap } from './keyboardTypes'

// Placeholder stack commands - will be replaced with actual implementations
const moveCellDown: Command = (context) => ({
  action: () => console.log(`Move down ${context.count} cells`),
});

const moveCellUp: Command = (context) => ({
  action: () => console.log(`Move up ${context.count} cells`),
});

const moveToTop: Command = () => ({
  action: () => console.log('Move to top'),
});

const moveToBottom: Command = () => ({
  action: () => console.log('Move to bottom'),
});

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

const enterVisualMode: Command = () => ({
  newKeyboardState: { mode: 'visual' },
  action: () => console.log('Enter visual mode'),
});

const enterSearchMode: Command = () => ({
  action: () => console.log('Enter search mode'),
});

const deleteCell: Command = (context) => ({
  action: () => console.log(`Delete ${context.count} cells`),
});

const yankCell: Command = (context) => ({
  action: () => console.log(`Yank ${context.count} cells to register ${context.register}`),
});

const pasteAfter: Command = (context) => ({
  action: () => console.log(`Paste from register ${context.register}`),
});

const pasteBefore: Command = (context) => ({
  action: () => console.log(`Paste before from register ${context.register}`),
});

const pushCellBelow: Command = () => ({
  newKeyboardState: { mode: 'insert' },
  action: () => console.log('Push new cell below'),
});

const pushCellAbove: Command = () => ({
  newKeyboardState: { mode: 'insert' },
  action: () => console.log('Push new cell above'),
});

const nextWorkspace: Command = () => ({
  action: () => console.log('Next workspace'),
});

const previousWorkspace: Command = () => ({
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

const rotateStack: Command = () => ({
  action: () => console.log('Rotate stack'),
});

const swapTop: Command = () => ({
  action: () => console.log('Swap top two cells'),
});

// Normal mode keymap
export const normalModeKeymap: Keymap = {
  // Navigation
  'j': moveCellDown,
  'k': moveCellUp,
  'g': {
    'g': moveToTop,
    't': nextWorkspace,
    'T': previousWorkspace,
  },
  'G': moveToBottom,
  
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
  '<Escape>': () => ({ newKeyboardState: { mode: 'normal' } }),
  'j': moveCellDown,
  'k': moveCellUp,
  'd': deleteCell,
  'y': yankCell,
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