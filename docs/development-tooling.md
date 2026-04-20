# Development Tooling

This repo uses the Vite + TypeScript + Three.js stack with Vitest for tests, ESLint for linting, and Prettier for formatting.

Available commands:

- `npm run build` - Type-check and build the app
- `npm test` - Run the Vitest suite
- `npm run lint` - Lint `src/` and `tests/`
- `npm run lint:fix` - Auto-fix lint issues where possible
- `npm run format` - Apply Prettier formatting
- `npm run format:check` - Verify formatting without writing changes

Recommended verification order for future tasks:

1. `npm run format`
2. `npm run lint`
3. `npm test`
4. `npm run build`
