# Prompt Management System Implementation Plan

## Overview
This document outlines the implementation plan for a prompt management system in Forgepad. The system will allow users to create, store, and reuse parameterized prompts that can be quickly inserted into their workflow with variable substitution.

## Core Requirements
1. **Storage**: Prompts stored in Convex database, associated with userId
2. **Naming**: Programmatic names (alphanumeric + underscores) for easy reference
3. **Templates**: Support {{variable}} syntax for dynamic content
4. **Access**: Hotkey-triggered modal for search and variable input
5. **Management**: CRUD interface in application sidebar
6. **Privacy**: All prompts are private to the creating user

## Database Schema

### Convex Table: `prompts`
```typescript
{
  _id: Id<"prompts">,
  name: string,           // e.g., "youtube_hook_generator"
  userId: string,         // Clerk user ID
  content: string,        // Template with {{variables}}
  description: string,    // For search and display
  createdAt: number,      // Unix timestamp
  updatedAt: number,      // Unix timestamp
}
```

### Validation Rules
- `name`: Must match `/^[a-zA-Z0-9_]+$/`, max 50 characters
- `content`: Required, max 10,000 characters
- `description`: Optional but recommended, max 200 characters
- Unique constraint on (userId, name) combination

## User Interface Components

### 1. Sidebar Navigation
- Add "Prompts" section below existing workspace navigation
- Icon: `FileText` or similar from lucide-react
- Links to prompts list page

### 2. CRUD Pages (`/prompts/*`)

#### List Page (`/prompts`)
- Table view with columns: Name, Description, Last Updated
- Search/filter by name or description
- Actions: Edit, Delete, Duplicate
- "New Prompt" button

#### Create/Edit Page (`/prompts/new`, `/prompts/[id]/edit`)
- Form fields:
  - Name (with validation feedback)
  - Description
  - Content (large textarea with monospace font)
- Live preview showing detected variables
- Save/Cancel buttons

#### View Page (`/prompts/[id]`)
- Read-only display of prompt details
- List of detected variables
- "Use Prompt" button (triggers modal)
- Edit/Delete actions

### 3. Prompt Selection Modal
Triggered by hotkey (e.g., `Ctrl+P` or `/` in normal mode)

#### Phase 1: Search
- Search input with focus on open
- Real-time filtering of prompts by name/description
- List shows: Name, Description, Variable count
- Keyboard navigation (up/down arrows)
- Enter to select, Escape to cancel

#### Phase 2: Variable Input
- Shows selected prompt name
- Dynamic form with input field for each {{variable}}
- Variables extracted via regex: `/\{\{(\w+)\}\}/g`
- Tab/Shift+Tab navigation between fields
- "Insert" button (or Enter on last field)
- Back button to return to search

### 4. Stack Integration
When user completes variable input:
1. Substitute all {{variables}} with provided values
2. Insert resulting text into the active prompt textarea
3. Do NOT auto-submit - user may want to edit
4. Close modal and focus textarea

## Implementation Steps

### Phase 1: Database Layer
1. Create Convex schema file `convex/prompts.ts`
2. Define table schema with validators
3. Implement CRUD mutations:
   - `createPrompt`
   - `updatePrompt`
   - `deletePrompt`
4. Implement queries:
   - `listPrompts` (with pagination)
   - `getPrompt`
   - `searchPrompts`

### Phase 2: UI Foundation
1. Add route group `/app/(authenticated)/prompts/`
2. Create shared layout with sidebar
3. Implement list page with data table
4. Build create/edit form with validation
5. Add view page

### Phase 3: Modal System
1. Create `PromptSearchModal` component
2. Implement two-phase UI (search → variables)
3. Add variable extraction logic
4. Build template substitution function
5. Create `usePromptModal` hook for global access

### Phase 4: Keyboard Integration
1. Add prompt search command to keyboard system
2. Register hotkey in normal mode
3. Connect to modal trigger
4. Test with existing keyboard architecture

### Phase 5: Polish & Testing
1. Add loading states and error handling
2. Implement optimistic updates
3. Add duplicate prompt functionality
4. Create example prompts for new users
5. Write tests for variable extraction/substitution

## Technical Considerations

### Variable Extraction
```typescript
function extractVariables(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const variables = new Set<string>();
  let match;
  while ((match = regex.exec(template)) !== null) {
    variables.add(match[1]);
  }
  return Array.from(variables);
}
```

### Template Substitution
```typescript
function substituteVariables(
  template: string, 
  values: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return values[variable] || match;
  });
}
```

### Hotkey Registration
Integrate with existing keyboard system:
```typescript
// In keyboard commands
{
  key: 'p',
  ctrlKey: true,
  action: { type: 'OPEN_PROMPT_SEARCH' }
}
```

## Future Enhancements (Out of Scope)
1. **Prompt Composition**: Reference other prompts with `{{@prompt_name}}`
2. **Stack Variables**: Auto-populate from stack cells `{{#1}}`, `{{@cell_name}}`
3. **Workspace Variables**: Pull from workspace-level variable store
4. **Shared Prompts**: Team/public prompt libraries
5. **Version History**: Track prompt changes over time
6. **Advanced Templates**: Conditionals, loops, transformations
7. **Export/Import**: Share prompt collections

## Success Criteria
1. Users can create prompts with memorable names
2. Variable substitution works reliably
3. Hotkey access is fast and responsive
4. CRUD operations follow app conventions
5. System integrates smoothly with stack-based workflow

## Example Use Cases

### YouTube Script Hook Generator
```
Name: youtube_hook_generator
Description: Generate compelling YouTube video hooks
Content:
Create a compelling hook for a YouTube video about {{topic}}.

Target audience: {{audience}}
Current state: {{current_state}}
Desired transformation: {{desired_outcome}}

The hook should:
- Create immediate curiosity
- Promise clear value
- Be under 15 seconds when spoken
- Include a pattern interrupt
```

### Code Review Checklist
```
Name: code_review_checklist
Description: Comprehensive code review for PR
Content:
Review the following code changes for {{component_name}}:

Focus areas:
- Security implications
- Performance impact
- Error handling
- Test coverage
- Documentation updates

Context: {{pr_description}}
```