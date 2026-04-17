# Agent UI SDK

**开箱即用的 AI 对话 UI SDK** — 一行代码跑起完整对话界面，每个部分都能自定义替换。

Built on [AI SDK](https://sdk.vercel.ai) + [AI Elements](https://elements.ai-sdk.dev) + [Streamdown](https://github.com/nichochar/streamdown).

## Why

| | agent-ui-sdk | ai-elements | assistant-ui |
|---|---|---|---|
| 开箱即用 | 一行代码完整界面 | 47 个散装组件，需自行组装 | 完整但需学习 runtime 抽象 |
| Tool 自定义 | 注册制，随插随拔 | 无注册机制 | 有，但绑定 6 层 runtime |
| Tool 分组 | Segment 引擎，自动分组 | 无 | 无 |
| 类型转换 | 零转换，直用 UIMessage | N/A | UIMessage → ThreadMessage 2 次转换 |
| 状态管理 | Zustand，简单直接 | 无（纯展示） | 自研 TAP 响应式系统 |
| React Native | 规划中 | 不支持 | 早期支持 |

## Quick Start

```bash
pnpm add @agent-ui-sdk/react
```

```tsx
import { Chat, ChatProvider } from "@agent-ui-sdk/react";
import { useChat } from "@ai-sdk/react";

function App() {
  const chatHelpers = useChat();

  return (
    <ChatProvider chatHelpers={chatHelpers}>
      <Chat />
    </ChatProvider>
  );
}
```

Done. You have a full chat UI with streaming markdown, reasoning blocks, and tool call rendering.

## Customization

### Register a custom tool renderer

```tsx
import { useToolUI } from "@agent-ui-sdk/react";

// Anywhere inside <ChatProvider> — registers on mount, cleans up on unmount
function WebSearchTool() {
  useToolUI({
    toolName: "web_search",
    render: ({ part }) => (
      <div className="rounded-lg border p-3">
        <h4>Searching: {part.args.query}</h4>
        {part.result && <SearchResults results={part.result} />}
      </div>
    ),
  });
  return null;
}
```

### Register a custom data renderer

```tsx
import { useDataUI } from "@agent-ui-sdk/react";

function ArtifactRenderer() {
  useDataUI({
    name: "artifact",
    render: ({ part }) => <ArtifactPreview data={part.data} />,
  });
  return null;
}
```

### Replace components

```tsx
<Chat
  components={{
    MessageRenderer: MyCustomMessageRenderer,
    Composer: MyCustomComposer,
    EmptyState: MyWelcomeScreen,
  }}
/>
```

## Architecture

```
┌─ 开箱即用层 ────────────────────────────────────┐
│  <Chat />  完整对话界面                          │
│  内置: Thread + Composer + ThreadList            │
│  内置: text / reasoning / tool 默认渲染          │
├─ 可替换层 ──────────────────────────────────────┤
│  useToolUI() / useDataUI()  注册自定义渲染器     │
│  components prop  替换任意子组件                 │
├─ 引擎层 (core, 跨平台共享) ─────────────────────┤
│  buildSegments()  message.parts 分组引擎         │
│  UIRegistry  栈式 tool/data 注册表               │
│  ThreadList store + HistoryAdapter               │
├─ 展示层 ────────────────────────────────────────┤
│  ai-elements  底层展示组件                       │
│  streamdown  流式 markdown 渲染                  │
├─ 数据层 ────────────────────────────────────────┤
│  AI SDK useChat()                                │
│  零转换，UIMessage 就是 canonical type           │
└─────────────────────────────────────────────────┘
```

### Segment Engine

Messages from AI SDK contain a flat array of `parts` (text, tool-call, reasoning, etc.). The segment engine groups them intelligently:

```
message.parts:
  [text, text, tool, tool, tool, text, reasoning]
       ↓ buildSegments()
segments:
  [TextSegment, ToolGroupSegment(3), TextSegment, ReasoningSegment]
```

- Consecutive text parts merge into one
- Consecutive tool calls collapse into a `ToolGroupCard`
- Child tools (via `_parentToolUseId`) nest under their parent `SubagentCard`
- Special tools (ask-user-question, etc.) get dedicated renderers
- Custom segment rules via configuration

### UIRegistry (Stack-based Registration)

```
Register A for "search" → stack: [A]
Register B for "search" → stack: [A, B]  → B renders (last wins)
Unmount B              → stack: [A]      → A renders (auto fallback)
```

This enables:
- Page-level default renderers
- Component-level overrides that auto-clean on unmount
- Zero configuration for common tools, full control for custom ones

### ThreadList & History

```tsx
import { ChatProvider, ThreadList } from "@agent-ui-sdk/react";

<ChatProvider
  chatHelpers={chatHelpers}
  historyAdapter={myHistoryAdapter}  // localStorage, API, IndexedDB...
>
  <ThreadList />
  <Chat />
</ChatProvider>
```

## Monorepo Structure

```
packages/
  core/              Platform-agnostic core (segment engine, registry, types)
  react/             React web styled components (Tailwind + ai-elements)
  react-native/      React Native styled components (planned)
```

**Dependency flow:** `react → core` and `react-native → core`

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `ai` / `@ai-sdk/react` | AI SDK v6 — useChat, UIMessage types |
| `ai-elements` | Vercel's pre-built AI UI components |
| `streamdown` | Streaming markdown renderer |
| `zustand` | State management (chat store, thread list) |

## Development

```bash
pnpm install          # Install dependencies
pnpm build            # Build all packages (Turborepo)
pnpm dev              # Dev mode (watch)
pnpm lint             # Lint (Biome)
pnpm test             # Test all packages
```

## Design Principles

1. **Zero type conversion** — AI SDK's `UIMessage` is the canonical type. No intermediate formats.
2. **Registry over switch/case** — Tool renderers are registered, not hardcoded. Adding a new tool never requires modifying core code.
3. **Segment-first rendering** — Messages are grouped into logical segments before rendering, enabling tool groups, subagent nesting, and custom grouping strategies.
4. **Progressive disclosure** — Works with zero config, customizable at every layer.
5. **Platform-ready core** — `buildSegments()`, `UIRegistry`, and `ThreadList` store are pure logic, shareable between Web and React Native.

## License

MIT
