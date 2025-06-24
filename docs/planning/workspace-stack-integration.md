# Workspace Stack Integration & Cleanup Plan

## Overview
This document outlines the plan for integrating the stack view functionality into the workspace route and cleaning up debug/test components that were created during development.

## Current State

### Workspace Route (`/workspace/[id]`)
- Displays workspace name and description
- Shows grid of stack cards with names and cell counts
- Has "Stack operations coming soon..." placeholder
- No actual stack interaction capability

### Available Components
- **StackView**: Complete stack display with AI input (extracted from demo)
- **StackTabs**: Tabbed interface for multiple stacks
- **StackDisplay**: Core cell rendering with keyboard navigation
- **ComputationalStackDisplay**: Shows RPN computational values
- **StackOperations**: Planned but not yet implemented

### Two Stack Paradigms
1. **Cell-based stacks**: Persistent cells stored in database (prompts, responses, etc.)
2. **Computational stacks**: Ephemeral RPN calculator values stored in `computationalStack` array

## Phase 1: Workspace Stack Integration

### Option A: Inline Stack View (Recommended)
Integrate StackTabs directly into the workspace page for immediate stack interaction.

#### Implementation Steps:
1. **Replace placeholder content** in workspace page with StackTabs component
2. **Pass workspace stacks** to StackTabs for tabbed navigation
3. **Maintain grid view** as collapsible section or remove entirely
4. **Add stack creation** directly in tabs UI
5. **Connect keyboard shortcuts** for stack navigation (Ctrl+1-9 for tabs)

#### Pros:
- Immediate access to stacks without navigation
- Similar to successful demo implementation
- Better keyboard workflow
- Single source of truth for workspace view

#### Cons:
- Less overview of all stacks at once
- May need UI for many stacks (scrollable tabs)

### Option B: Dedicated Stack Routes
Create separate routes for individual stack views.

#### Implementation Steps:
1. **Create new route**: `/workspace/[id]/stack/[stackId]/page.tsx`
2. **Make stack cards clickable** in workspace page
3. **Add breadcrumb navigation** for workspace > stack hierarchy
4. **Implement back navigation** to workspace view
5. **Consider modal view** as alternative to full page navigation

#### Pros:
- Clear separation of concerns
- Can show more stack details
- Familiar navigation pattern

#### Cons:
- More clicks to access stacks
- Loses context when navigating
- Harder to switch between stacks

## Phase 2: Computational Stack Integration

### Design Decisions Needed:
1. **Unified or Separate?**
   - Option 1: Show computational stack as special cell type in main stack
   - Option 2: Separate panel/sidebar for computational values
   - Option 3: Toggle between cell view and computational view

2. **RPN Operations UI**
   - Keyboard-driven (preferred for RPN enthusiasts)
   - Button panel for mouse users
   - Both with keyboard as primary

3. **Variable Interpolation**
   - How to reference computational stack values in prompts
   - Visual indicators for available variables
   - Auto-complete or picker UI

### Implementation Steps:
1. **Create StackOperations component** with RPN operations
2. **Add computational stack display** to StackView
3. **Implement keyboard handlers** for RPN operations
4. **Add variable interpolation** in prompt input
5. **Create help/reference panel** for operations

## Phase 3: Component Cleanup ✅ COMPLETED

### Components Removed:

#### 1. Test Pages (5 files)
- `/src/app/keyboardDemo/page.tsx`
  - **Purpose**: Keyboard system testing
  - **Why safe**: Not linked anywhere, testing complete
  
- `/src/app/latency-test/page.tsx`
  - **Purpose**: Textarea latency measurement
  - **Why safe**: Performance issue resolved, no longer needed
  
- `/src/app/stack-latency-test/page.tsx`
  - **Purpose**: Stack component performance testing
  - **Why safe**: Uses debug components, testing complete

#### 2. Debug Stack Components (5 files)
- `/src/components/stack/StackViewDebug.tsx`
  - **Purpose**: Render count logging
  - **Why safe**: Only used by stack-latency-test
  
- `/src/components/stack/StackViewDebug2.tsx`
  - **Purpose**: Minimal version without features
  - **Why safe**: Only used by stack-latency-test
  
- `/src/components/stack/StackViewMinimal.tsx`
  - **Purpose**: No keyboard/Convex version
  - **Why safe**: Only used by stack-latency-test
  
- `/src/components/stack/StackViewProfile.tsx`
  - **Purpose**: Performance profiling version
  - **Why safe**: Only used by stack-latency-test
  
- `/src/components/stack/StackViewNoConvex.tsx`
  - **Purpose**: Testing without database
  - **Why safe**: Only used by stack-latency-test

### Components to Keep:
- `/src/app/demo/chat/page.tsx` - Linked from home page
- `/src/app/(authenticated)/demo/stack/page.tsx` - Linked from home page
- All test files in `__tests__` directories - Part of test suite

## Implementation Order

### Week 1: Basic Integration
1. [ ] Implement Option A - inline StackTabs in workspace page
2. [ ] Test keyboard navigation and tab switching
3. [ ] Ensure proper auth and data access
4. [ ] Add loading states and error handling

### Week 2: Computational Stack
1. [ ] Design computational stack UI placement
2. [ ] Implement StackOperations component
3. [ ] Add RPN keyboard handlers
4. [ ] Test computational operations

### Week 3: Polish & Cleanup
1. [ ] Add variable interpolation
2. [ ] Implement help/documentation
3. [ ] Remove all debug components
4. [ ] Update navigation and breadcrumbs

## Testing Checklist

Before removing debug components:
- [ ] Verify keyboard input has no latency issues
- [ ] Confirm no performance regressions
- [ ] Test with multiple stacks and many cells
- [ ] Verify all production features work

After integration:
- [ ] Test stack creation from workspace
- [ ] Verify keyboard shortcuts (Ctrl+1-9)
- [ ] Test AI generation in workspace context
- [ ] Verify computational stack operations
- [ ] Test variable interpolation

## Rollback Plan

If issues arise:
1. Debug components are in git history
2. Can temporarily restore for debugging
3. Consider keeping one minimal test page
4. Document any performance benchmarks before removal

## Success Criteria

1. **User Experience**
   - Seamless navigation from workspace to stacks
   - Fast keyboard-driven workflow
   - Clear visual hierarchy

2. **Technical**
   - No performance regressions
   - Clean component structure
   - Proper separation of concerns

3. **Cleanup**
   - All debug components removed
   - No unused imports or dead code
   - Consistent naming and organization