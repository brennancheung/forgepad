# ForgePad Design Document

## Vision
An LLM-powered, keyboard-first, stack-based interface that combines the power of RPN calculators with modern AI capabilities. Think HP-48G meets Jupyter meets ChatGPT.

## Core Concepts

### 1. Stack-Based Paradigm
- **LIFO Operations**: Push, pop, duplicate, swap, rotate, roll
- **Multiple Named Stacks**: Work with multiple contexts simultaneously
- **Stack References**: Refer to items by position (1, 2, 3...) or name (@summary, @data)
- **Cross-Stack Operations**: Move/copy items between stacks

### 2. Cell Types
- **Text**: Plain text, markdown, documentation
- **Prompt**: LLM prompts with variable interpolation
- **Response**: LLM-generated content
- **Code**: Executable code blocks with language support
- **Data**: JSON, CSV, structured data
- **Widget**: Interactive UI components (charts, forms, etc.)

### 3. Keyboard-First Interface
Everything should be achievable without touching the mouse:
- **Vi-like modal editing**: Normal mode for navigation, Insert mode for editing
- **Single-key operations**: 
  - `d` - drop (pop)
  - `D` - clear stack
  - `s` - swap top two
  - `r` - rotate top three
  - `y` - yank (copy)
  - `p` - paste
  - `n` - name current cell
  - `/` - search
  - `:` - command mode
- **Workspace navigation**: `Alt+[1-9]` or `[1-9]` in normal mode
- **Stack navigation**: `j/k` for up/down, `J/K` for jump to bottom/top
- **Quick actions**: `Space` for command palette

### 4. Variable System & Interpolation
- **Cell References**: `{{@cellname}}` or `{{#3}}` (stack position)
- **Variable Definitions**: Store values for reuse
- **Template Prompts**: Save and reuse prompt templates
- **Chaining**: Reference outputs from previous LLM calls

### 5. Workspace Management
- **Named Workspaces**: Organize different contexts/projects
- **Persistent State**: Auto-save all stacks
- **Quick Switch**: Number keys or fuzzy search
- **Templates**: Pre-configured workspace setups

## User Workflows

### Example 1: Code Analysis
```
1. Push code file to stack
2. Push analysis prompt: "Explain {{#1}} focusing on performance"
3. Execute (Ctrl+Enter) - pushes response
4. Push follow-up: "Suggest optimizations for {{@explanation}}"
5. Execute - pushes optimization suggestions
```

### Example 2: Data Processing
```
1. Push CSV data
2. Name it: `n` → "sales_data"
3. Push prompt: "Analyze trends in {{@sales_data}}"
4. Execute
5. Push: "Create a chart showing {{#1}}"
6. Execute - produces interactive chart widget
```

### Example 3: Multi-Stack Workflow
```
Stack 1: Research notes
Stack 2: Code implementations  
Stack 3: Documentation

- Collect information in Stack 1
- Generate code in Stack 2 referencing Stack 1
- Create docs in Stack 3 referencing both
```

## Technical Architecture

### Frontend Components
- **StackView**: Displays a single stack with cells
- **WorkspaceManager**: Handles multiple stacks
- **CellRenderer**: Polymorphic rendering based on cell type
- **CommandPalette**: Fuzzy search for commands
- **KeyboardManager**: Global hotkey handling

### State Management
- **Convex for persistence**: Real-time sync, collaboration-ready
- **Local state for UI**: Current focus, selection, modes
- **Undo/Redo system**: Command pattern for operations

### LLM Integration
- **Provider abstraction**: Support multiple LLM providers
- **Streaming responses**: Real-time output
- **Token counting**: Track usage
- **Context management**: Smart truncation for long conversations

## Key Design Decisions

### 1. Why RPN/Stack-Based?
- **Composability**: Operations naturally chain together
- **Visibility**: See all intermediate results
- **Simplicity**: No hidden state, everything on the stack
- **Power**: Complex workflows from simple primitives

### 2. Why Keyboard-First?
- **Speed**: No context switching to mouse
- **Flow**: Stay in the zone while working
- **Accessibility**: Better for screen readers
- **Power users**: Developers prefer keyboard

### 3. Why Named Cells?
- **Clarity**: Reference by meaning, not position
- **Stability**: References don't break when stack changes
- **Reusability**: Build a library of named components

## MVP Feature Set

### Phase 1: Core Stack Operations
- [ ] Basic stack operations (push, pop, dup, swap)
- [ ] Text cells only
- [ ] Single stack view
- [ ] Keyboard navigation

### Phase 2: LLM Integration
- [ ] OpenAI/Anthropic integration
- [ ] Prompt cells with variable interpolation
- [ ] Response cells
- [ ] Streaming support

### Phase 3: Multi-Stack
- [ ] Multiple named stacks
- [ ] Workspace switching
- [ ] Cross-stack operations
- [ ] Persistent state

### Phase 4: Advanced Features
- [ ] Code execution cells
- [ ] Data visualization widgets
- [ ] Export/Import
- [ ] Collaboration features

## Open Questions

1. **Cell Mutability**: Should cells be immutable (functional style) or mutable?
2. **Execution Model**: Explicit execution (Ctrl+Enter) or auto-execution?
3. **Stack Limits**: Maximum stack depth? Auto-cleanup?
4. **Sharing**: Public links? Team workspaces?
5. **Mobile**: How to handle keyboard-first on mobile?
6. **Offline**: Local LLM support? Offline mode?

## Inspiration & References
- HP RPN calculators (48G, Prime)
- Forth programming language
- Jupyter notebooks
- Emacs/Vim modal editing
- ObservableHQ reactive notebooks
- Mathematica notebooks

## Next Steps
1. Validate core UX with prototypes
2. Design keyboard shortcut system in detail
3. Plan data model for Convex
4. Create mockups for key workflows
5. Build proof-of-concept for stack operations