# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm build` - Build the application for production (use this to check if the code compiles)
- `pnpm lint` - Run ESLint to check for code quality issues
- `pnpm dev` - Start development server (DO NOT run this - user will run it manually)
- `pnpm ai` - Run type checking and linting (faster alternative to pnpm build)

### Testing
- `pnpm test` - Run all tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report

### Database
- `convex dev` - Start Convex development server (DO NOT run this - it's non-terminating and user will run it manually)

## Architecture Overview

### Stack-Based Paradigm
Forgepad.ai implements an interactive, stack-based user experience inspired by RPN calculators for LLM-driven workflows. Key concepts:

1. **Interactive Stack**: LIFO structure where each item is a "cell" containing prompts, responses, or data
2. **Cell Types**: text, prompt, response, data, code, widget, computational
3. **Stack Operations**: push, pop, duplicate, swap, rotate, query, transform
4. **Variable Interpolation**: Reference cells by position (`{{#3}}`) or name (`{{@summary}}`)
5. **Multiple Workspaces**: Users can have multiple named stacks for different contexts
6. **Interactive Widgets**: Cells can contain interactive UI components
7. **Card Viewers**: Custom renderers for different content types

### Project Structure
- `/src/app/` - Next.js App Router pages and layouts
  - `(authenticated)/` - Protected routes requiring authentication
  - `api/` - API routes for webhooks and AI chat
- `/src/components/` - React components
  - `ui/` - shadcn/ui components (46 pre-built components)
  - `workspace/` - Workspace management components
  - `stack/` - Stack display and manipulation
  - `cells/` - Cell rendering components
- `/src/lib/` - Utility functions and core logic
  - `keyboard/` - Comprehensive vim-like keyboard system
  - `rpn/` - RPN calculator operations
  - `utils.ts` - Includes `cn()` for className merging
- `/convex/` - Backend database schema and functions
- `/docs/` - Architecture documentation and planning

### Technology Stack
- **Framework**: Next.js 15.3.4 with App Router and Turbopack
- **Database**: Convex for real-time data synchronization
- **UI**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS 4.x with CSS variables
- **Authentication**: Clerk (installed but not fully configured)
- **AI Integration**: Vercel AI SDK v5 with OpenAI provider
- **Forms**: React Hook Form + Zod validation
- **State Management**: Convex as single source of truth
- **Testing**: Jest with React Testing Library

### Convex Database Schema
- **users**: Clerk user integration with profiles
- **workspaces**: Named contexts with LLM settings (model, temperature, maxTokens)
- **stacks**: Named stacks within workspaces containing computational stack array
- **cells**: Individual stack items with type, content, status, and metadata
- **operations**: Audit trail of all stack operations

### Key Implementation Notes

1. **Component Usage**: Use existing shadcn/ui components from `/src/components/ui/` before creating new ones
2. **Styling**: Use the `cn()` utility from `/src/lib/utils.ts` for conditional classes
3. **TypeScript**: Strict mode is enabled - ensure proper typing
4. **Path Aliases**: Use `@/` to import from the `src/` directory
5. **Keyboard System**: Fully implemented vim-like keyboard navigation - avoid reimplementing keyboard handling
6. **Testing**: Run `pnpm test` to ensure all tests pass before major changes
7. **State Management**: Use Convex for all state - no client-side state management needed
8. **AI Operations**: Use Next.js Server Actions, not API routes, for LLM interactions

### Development Guidelines

1. When implementing stack operations:
   - All operations should be recorded in the operations table
   - Stack state is stored in Convex, not client state
   - Use pure functions for computational logic
   - Follow RPN semantics for stack manipulation

2. For AI integration:
   - Use server actions in `/src/app/actions/`
   - Stream responses using AI SDK streaming
   - Update cell state in Convex during streaming
   - Handle errors as cell states, not exceptions

3. Keyboard system integration:
   - Use `useKeyboard()` hook to access keyboard state
   - Keyboard generates semantic commands, app layer executes them
   - See `/docs/keyboard-system-overview.md` for details
   - All keyboard logic is pure functional and thoroughly tested
   - DO NOT reimplement keyboard handling - use existing system

4. Database operations:
   - Always use Convex functions for data operations
   - Schema is fully typed with validators
   - Real-time updates happen automatically
   - No need for manual cache invalidation

### Environment Variables

Required environment variables:
```
# Convex
NEXT_PUBLIC_CONVEX_URL
CONVEX_DEPLOYMENT

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# OpenAI
OPENAI_API_KEY
```

### Current Implementation Status

**Completed**:
- Basic Next.js setup
- UI component library fully installed (46 shadcn/ui components)
- Keyboard system implemented (Phases 1-3)
  - Vim-like modal editing (normal, insert, visual, command, search modes)
  - Stack navigation and manipulation commands
  - Search, workspace navigation, and dot repeat
  - Comprehensive test coverage (86+ tests)
- Basic workspace/stack data model in Convex
- Demo pages for keyboard system (`/keyboardDemo`)

**Pending Implementation**:
- Stack UI components and cell rendering
- AI SDK integration with streaming
- Computational stack operations
- Authentication middleware setup
- Workspace persistence and switching
- Interactive widgets and card viewers