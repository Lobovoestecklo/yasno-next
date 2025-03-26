# CLAUDE.md - Agent Guidelines for Scenario Coach Codebase

## Build Commands
- `npm run dev` - Start development server
- `npm run build` - Build production app
- `npm run start` - Start production server

## Lint & Test Commands
- `npm run lint` - Run ESLint
- `npm run test` - Run all Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test -- -t "test name"` - Run single test

## Code Style Guidelines
- **Imports**: Use absolute imports with `@/` path alias (maps to `./src/`)
- **Types**: Use TypeScript strictly; define interfaces with `I` prefix (e.g., `IMessage`)
- **Naming**: PascalCase for components, camelCase for functions/variables, prefix hooks with "use"
- **Components**: Function components with explicit return types
- **Error Handling**: Use try/catch blocks with graceful fallbacks
- **State Management**: React hooks for local state, context for global state
- **Testing**: Jest with mock implementations for browser APIs

## Project Structure
- `src/app` - Next.js pages and API routes
- `src/components` - Reusable React components
- `src/lib` - Utilities, hooks, and business logic
- `src/types` - TypeScript type definitions