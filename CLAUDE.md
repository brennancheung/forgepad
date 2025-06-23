# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm build` - Build the application for production (use this to check if the code compiles)
- `pnpm lint` - Run ESLint to check for code quality issues
- `pnpm dev` - Start development server (DO NOT run this - user will run it manually)

### Testing
- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report

## Architecture Overview

### Stack-Based Paradigm
Forgepad.ai implements an interactive, stack-based user experience inspired by RPN calculators for LLM-driven workflows. Key concepts:

1. **Interactive Stack**: LIFO structure where each item is a "cell" containing prompts, responses, or data
2. **Multiple Workspaces**: Users can have multiple named stacks for different contexts
3. **Named Cells**: Stack items can be referenced by position or custom names
4. **Interactive Widgets**: Cells can contain interactive UI components
5. **Card Viewers**: Custom renderers for different content types

### Project Structure
- `/src/app/` - Next.js App Router pages and layouts
- `/src/components/ui/` - shadcn/ui components (46 pre-built components)
- `/src/hooks/` - Custom React hooks
- `/src/lib/` - Utility functions including `cn()` for className merging
- `/src/lib/keyboard/` - Keyboard system implementation (see [Keyboard System Overview](/docs/keyboard-system-overview.md))
- `/docs/` - Architecture documentation and planning

### Technology Stack
- **Framework**: Next.js 15.3.4 with App Router and Turbopack
- **UI**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS 4.x with CSS variables
- **Authentication**: Clerk integration (not yet implemented)
- **Forms**: React Hook Form + Zod validation
- **State Management**: To be implemented for stack operations

### Key Implementation Notes

1. **Component Usage**: Use existing shadcn/ui components from `/src/components/ui/` before creating new ones
2. **Styling**: Use the `cn()` utility from `/src/lib/utils.ts` for conditional classes
3. **TypeScript**: Strict mode is enabled - ensure proper typing
4. **Path Aliases**: Use `@/` to import from the `src/` directory
5. **Keyboard System**: Fully implemented vim-like keyboard navigation - avoid reimplementing keyboard handling
6. **Testing**: Run `pnpm test` to ensure all tests pass before major changes

### Development Guidelines

1. When implementing stack operations, consider:
   - Cell state management (position, name, content, type)
   - Stack operations (push, pop, duplicate, swap, rotate)
   - Multi-stack workspace management
   - Persistence and session management

2. For interactive components:
   - Leverage existing shadcn/ui components
   - Use React Hook Form for form handling
   - Implement proper loading and error states

3. Keyboard system integration:
   - Use `useKeyboard()` hook to access keyboard state
   - Keyboard generates semantic commands, app layer executes them
   - See [Keyboard System Overview](/docs/keyboard-system-overview.md) for details
   - All keyboard logic is pure functional and thoroughly tested

4. Authentication flow (when implementing):
   - Clerk is already installed
   - Will need middleware setup
   - Consider workspace-level permissions

### Current Implementation Status
- Basic Next.js setup complete
- UI component library fully installed (46 shadcn/ui components)
- Keyboard system implemented (Phases 1-3 complete)
  - Vim-like modal editing (normal, insert, visual, command, search modes)
  - Stack navigation and manipulation commands
  - Search, workspace navigation, and dot repeat
  - Comprehensive test coverage (86+ tests)
- Basic workspace/stack data model in Convex
- Demo pages for keyboard system (`/keyboardDemo`)
- Authentication library installed but not fully configured
- Stack UI and computational features pending