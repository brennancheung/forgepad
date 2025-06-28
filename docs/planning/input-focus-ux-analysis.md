# Input Focus and Keyboard Navigation UX Analysis

## Current Understanding of Forgepad Vision

Forgepad.ai is building a **stack-based interface for AI interaction** inspired by RPN calculators and vim. The core innovation is treating AI interactions as manipulable computational artifacts on a stack, enabling non-linear workflows and composable operations.

### Key Elements:
1. **Stack-Based Paradigm**: LIFO structure where cells (prompts, responses, data) can be manipulated, referenced, and composed
2. **Vim-Like Navigation**: Modal keyboard system for efficient stack manipulation without mouse
3. **Multi-Workspace**: Multiple stacks across workspaces with quick switching
4. **Variable Interpolation**: Reference any cell by position (`{{#3}}`) or name (`{{@data}}`)
5. **Yanking/Pasting**: Copy cells between stacks, enabling workflow composition
6. **RPN Calculator**: Immediate computational operations integrated with AI

## The Focus Conflict Problem

### Current Issues:
1. **Multiple Focus Targets**: Main prompt textarea, JSON editor, name inputs all compete for focus
2. **Mode Confusion**: When clicking an input field, unclear if you're in normal or insert mode
3. **Global Key Interference**: Typing 'i' in JSON editor triggers insert mode and focuses prompt
4. **Auto-save Conflicts**: Immediate saves cause re-renders and focus loss
5. **Event Bubbling**: Keyboard events in inputs trigger navigation commands

### Root Cause:
The vim paradigm assumes **one primary editing target** (the document), but Forgepad has **multiple editable surfaces** (prompt, sources, cells) that need simultaneous availability.

## UX Design Solutions

### Solution 1: **Explicit Modal Boundaries** ⭐ Recommended
Create clear visual and behavioral boundaries between stack operations and auxiliary inputs.

**Concept**: The stack is the primary vim-controlled surface. Auxiliary panels (sources, settings) operate in "always-insert" mode.

**Implementation**:
- Stack area: Full vim modal control (normal, insert, visual modes)
- Side panels: Always accept typing, no mode switching needed
- Visual indicator: Border color shows which area has vim control
- Escape key: Always returns focus to stack from any input

**Pros**: 
- Clear mental model
- No mode confusion in auxiliary inputs
- Preserves vim efficiency for primary workflow

**Cons**: 
- Can't use vim navigation in side panels
- Requires visual design to communicate boundaries

### Solution 2: **Nested Modal Contexts**
Each major area (stack, sources panel, etc.) has its own modal context.

**Concept**: Like tmux panes - each pane has independent vim modes.

**Implementation**:
- Leader key (e.g., Ctrl+W) to switch between contexts
- Each context maintains its own mode state
- Visual indicator shows active context and its mode
- Local escape returns to normal mode within context

**Pros**: 
- Vim navigation available everywhere
- Powerful for advanced users

**Cons**: 
- Steep learning curve
- Complex state management
- Potential for user confusion

### Solution 3: **Focus-Activated Insert Mode**
Any input field automatically enters insert mode on focus, exits on blur.

**Concept**: Clicking = entering insert mode for that field.

**Implementation**:
- Focus any input → automatic insert mode
- Blur (Escape/Tab/Click elsewhere) → return to normal mode
- Disable global key handlers when any input is focused
- Show mode indicator near focused input

**Pros**: 
- Intuitive for beginners
- Works with existing code patterns

**Cons**: 
- Mode changes might feel "jumpy"
- Conflicts with vim muscle memory
- Multiple inputs visible = unclear which has focus

### Solution 4: **Command Palette for Auxiliary Operations**
Remove persistent input fields, use command palette for all auxiliary operations.

**Concept**: Like VS Code - everything is a command.

**Implementation**:
- `:source add [name]` - Opens modal for adding source
- `:source edit [name]` - Opens editor for specific source
- All inputs are in modal dialogs, not persistent UI
- Main interface stays in stack-focused vim mode

**Pros**: 
- Extremely clean, focused interface
- No focus conflicts
- Very vim-like

**Cons**: 
- Less discoverable
- Slower for frequent edits
- Requires memorizing commands

### Solution 5: **Hybrid Insert-First** 
Invert the vim paradigm - default to insert mode, use Escape for navigation.

**Concept**: Like Jupyter notebooks - insert by default, modal for special operations.

**Implementation**:
- Default mode is insert for whatever has focus
- Escape enters "navigation mode" (like vim normal)
- Navigation mode highlighted with strong visual indicator
- Any click returns to insert mode

**Pros**: 
- Familiar to non-vim users
- No surprise key captures
- Works well with multiple inputs

**Cons**: 
- Not truly vim-like
- Loses efficiency for power users
- Against the Forgepad philosophy

## Recommendation: Solution 1 with Enhancements

**Explicit Modal Boundaries** best aligns with Forgepad's vision while solving the focus conflicts.

### Enhanced Design:
1. **Three Zones**:
   - **Stack Zone**: Full vim modal control (center)
   - **Auxiliary Zones**: Always-insert (sources panel, settings)
   - **Command Zone**: The prompt area at bottom

2. **Visual Design**:
   - Colored borders indicate active zone
   - Mode indicator shows current mode for stack zone only
   - Auxiliary zones have subtle "always-typing" indicator

3. **Keyboard Flow**:
   - `Tab` cycles between zones
   - `Escape` always returns to stack normal mode
   - `Ctrl+W` + arrow navigates zones (vim-like)
   - When in auxiliary zone, all keys just type

4. **Smart Defaults**:
   - Clicking auxiliary input doesn't change vim mode
   - Typing in auxiliary doesn't trigger vim commands
   - Can still yank/paste from stack to auxiliary via commands

### Why This Works:
- **Preserves Vim Power**: Stack operations remain efficient
- **Eliminates Confusion**: Clear which keys do what where
- **Supports Workflow**: Can edit sources while maintaining stack position
- **Scalable**: Works as more auxiliary panels are added
- **Learnable**: Simple mental model - "stack is vim, sides are not"

### Migration Path:
1. Start by disabling vim keys when auxiliary inputs have focus
2. Add visual borders to indicate zones
3. Implement zone navigation shortcuts
4. Refine based on user feedback

This solution maintains Forgepad's vision of vim-powered stack manipulation while providing a practical solution for the multi-input reality of the interface.