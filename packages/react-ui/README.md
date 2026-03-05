# @agent-ui-sdk/ui

Styled UI components for [Agent UI SDK](https://github.com/your-org/agent-ui-sdk), built with **Tailwind CSS v4** and **shadcn/ui** primitives.

## Installation

```bash
pnpm add @agent-ui-sdk/ui
# or
npm install @agent-ui-sdk/ui
```

Peer dependencies (must be in your project):

```bash
pnpm add tailwindcss@^4 react react-dom
```

## Setup

### 1. Import the CSS

In your root CSS file (e.g., `app/globals.css`):

```css
@import "@agent-ui-sdk/ui/globals.css";
```

### 2. Configure Tailwind content path

In your `tailwind.config.ts` (or wherever Tailwind scans):

```ts
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/@agent-ui-sdk/ui/src/**/*.{ts,tsx}", // ← add this
  ],
};
```

Or with Tailwind v4 `@source` in CSS:

```css
@import "tailwindcss";
@source "../node_modules/@agent-ui-sdk/ui/src";
@import "@agent-ui-sdk/ui/globals.css";
```

## Usage

```tsx
import { AgentUIProvider } from "@agent-ui-sdk/core/react";
import { Thread, Composer, UserMessage, AssistantMessage } from "@agent-ui-sdk/ui";

function App() {
  return (
    <AgentUIProvider>
      <div className="flex h-screen flex-col">
        <Thread
          components={{
            Message: ({ message, index }) =>
              message.role === "user" ? (
                <UserMessage message={message} index={index} />
              ) : (
                <AssistantMessage message={message} index={index} />
              ),
          }}
        />
        <Composer />
      </div>
    </AgentUIProvider>
  );
}
```

## Theming

Override design tokens in your CSS:

```css
:root {
  --aui-primary: hsl(262 83% 58%);   /* purple primary */
  --aui-radius: 0.75rem;              /* rounder corners */
}
```

Dark mode is controlled by the `.dark` class on any ancestor element.

## Components

| Component | Description |
|---|---|
| `<Thread>` | Full chat thread container |
| `<UserMessage>` | User message bubble |
| `<AssistantMessage>` | Assistant message layout |
| `<EditComposer>` | Inline message edit composer |
| `<Composer>` | Message input with send button |
| `<ActionBar>` | Copy / edit / reload / feedback buttons |
| `<CodeBlock>` | Syntax-highlighted code block |
| `<Reasoning>` | Collapsible AI reasoning panel |
| `<BranchPicker>` | Message branch navigation |
| `<Confirmation>` | Tool call approval UI |
