# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`agent-ui-sdk` is a ready-to-use AI chat UI SDK. One line of code gives you a complete chat interface; every part is customizable or replaceable.

Built on [AI SDK](https://sdk.vercel.ai) + [ai-elements](https://www.npmjs.com/package/ai-elements).

**Goal:** Provide out-of-the-box AI chat components (no step-by-step assembly required) while maintaining full customization flexibility.

## Commands

```bash
# Install dependencies
pnpm install

# Build all packages (respects dependency order via Turborepo)
pnpm build

# Dev mode (watch all packages)
pnpm dev

# Lint (Biome)
pnpm lint
pnpm lint:fix

# Test all packages
pnpm test

# Single package commands
pnpm --filter @agent-ui-sdk/core test
pnpm --filter @agent-ui-sdk/core test:watch
pnpm --filter @agent-ui-sdk/react build
pnpm --filter @agent-ui-sdk/core typecheck

# Run a single test file
cd packages/core && npx vitest run src/__tests__/some.test.ts
```

## Monorepo Structure

```
packages/
  core/              Platform-agnostic core (segment engine, UI registry, types)
  react/             React web styled components (Tailwind + ai-elements)
  react-native/      React Native styled components (planned)
```

**Dependency flow:** `react → core` and `react-native → core`

## Architecture

### Core (`@agent-ui-sdk/core`)

Platform-agnostic, no React/DOM/RN dependencies. Contains:

- **Segment engine** (`buildSegments`): Groups flat `message.parts` into logical segments (text merge, tool group collapse, subagent nesting)
- **UIRegistry**: Stack-based tool/data renderer registration. Last registration wins, auto-cleanup on unmount.
- **Types**: Re-exports and extends AI SDK's `UIMessage` as canonical type. Zero type conversion.

### React (`@agent-ui-sdk/react`)

Styled web components built on core + ai-elements. Provides:

- `<Chat />` — Complete chat UI (one component)
- `<ChatProvider>` — Context provider bridging AI SDK's `useChat`
- `useToolUI()` / `useDataUI()` — Register custom renderers
- `components` prop — Replace any sub-component

### React Native (`@agent-ui-sdk/react-native`)

Styled RN components (planned). Same API surface as React package.

## Key Patterns

**Zero type conversion:** AI SDK's `UIMessage` is the canonical type. No intermediate formats.

**Registry over switch/case:** Tool renderers are registered via `useToolUI()`, not hardcoded. Adding a new tool never requires modifying core code.

**Segment-first rendering:** Messages are grouped into logical segments before rendering, enabling tool groups, subagent nesting, and custom grouping.

**Progressive disclosure:** Works with zero config, customizable at every layer.

## Code Style

- **Biome** for linting and formatting: 2-space indent, double quotes, trailing commas, semicolons, 100-char line width, LF line endings
- **Conventional Commits** enforced by commitlint (pre-commit hook via Lefthook)
- **TypeScript strict mode** with `noUncheckedIndexedAccess: true`, `verbatimModuleSyntax: true`
- Bundler: `tsdown` (Rolldown-based), outputs ESM + CJS dual format
- Changesets for versioning; git-cliff for changelog generation
