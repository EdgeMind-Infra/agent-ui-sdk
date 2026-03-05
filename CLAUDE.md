# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`agent-ui-sdk` is a headless UI SDK for building AI chat interfaces. It provides platform-agnostic core logic, headless React/React Native primitives, and styled component layers. Architecture is inspired by Radix UI and assistant-ui's compound component pattern.

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
cd packages/core && npx vitest run src/grouping.test.ts
```

## Monorepo Structure

```
packages/
  core/              Platform-agnostic core (types, stores, algorithms)
  react/             React web headless primitives
  react-native/      React Native headless primitives
  react-ui/          Styled web components (Tailwind v4 + shadcn/ui)
  react-native-ui/   Styled RN components (JS theme tokens)
  build-utils/       Shared tsconfig base files (private)
examples/
  web/               Next.js 16 demo app
  rn/                Expo 55 demo app
```

**Dependency flow:** `react-ui → react → core` and `react-native-ui → react-native → core`

## Architecture

### Core Sub-path Exports

`@agent-ui-sdk/core` has three entry points:
- `.` — platform-agnostic: MessageRepository, UIRegistry, groupParts, StreamAnimator, types
- `./react` — React bindings: Zustand store, AgentUIProvider, hooks (useToolUI, useDataUI, useMessageBranch, useSegmentCache)
- `./ai-sdk` — AI SDK v6 bridge: useAISDKRuntime (bridges `useChat` to the Zustand store)

### Key Patterns

**Compound components:** Every primitive is a namespace with `.Root`, `.Messages`, `.Input`, etc. sub-components sharing context. Example: `Thread.Root > Thread.Messages > Message.Root > Message.Parts`.

**data-aui attributes:** All primitives emit `data-aui="thread"`, `data-role="assistant"`, `data-status="streaming"` etc. Styled packages select on these attributes with Tailwind.

**UIRegistry (stack-based renderer registration):** Consumers register tool/data renderers via `useToolUI({ toolName, render })`. Last registration wins (stack). Unregisters on unmount.

**MessageRepository (branch-aware message tree):** Supports ChatGPT-style edit/regenerate branches. Each message node has `childIds[]` + `activeBranchIndex`. `getMessages()` walks the active branch.

**Zustand store:** Central state via `createAgentUIStore` holding messages, chatStatus, isRunning, error, MessageRepository, UIRegistry, and RuntimeActions.

**AI SDK v6 types as canonical:** `UIMessage` from AI SDK v6 (`ai` package) is adopted directly — no type conversion layer.

**StreamAnimator:** Platform-agnostic adaptive-speed text animation. Platform provides `setText` + `scheduleFrame` callbacks. Used by React Native's `useSmooth()` hook.

### Platform Mirroring

`@agent-ui-sdk/react` and `@agent-ui-sdk/react-native` expose identical compound component APIs (`Thread`, `Message`, `ActionBar`, `Composer`, `BranchPicker`, `ToolCall`) with platform-specific implementations (HTML elements vs RN View/FlatList/Pressable).

## Code Style

- **Biome** for linting and formatting: 2-space indent, double quotes, trailing commas, semicolons, 100-char line width, LF line endings
- **Conventional Commits** enforced by commitlint (pre-commit hook via Lefthook)
- **TypeScript strict mode** with `noUncheckedIndexedAccess: true`, `verbatimModuleSyntax: true`
- CSS class names use `aui-*` prefix; CSS custom properties use `--aui-*` prefix
- Bundler: `tsdown` (Rolldown-based), outputs ESM + CJS dual format
- Changesets for versioning; git-cliff for changelog generation
