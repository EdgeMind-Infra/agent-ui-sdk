# assistant-ui 架构深度分析

> 调研日期：2026-03-04
> 源码版本：assistant-ui 最新 main 分支（D:\workspace-desktop\assistant-ui）

本文档记录对 assistant-ui 核心架构的深度源码分析，作为 agent-ui-sdk 设计参考。

## 1. Tap 响应式系统

assistant-ui 的核心状态管理不在 React 内部，而是自建了一套名为 **Tap** 的响应式微框架（`packages/tap/`）。

### Resource Fibers

架构直接镜像 React Fiber：

- `Resource` = 函数组件，调用返回 `ResourceElement`（描述符，非执行）
- `ResourceFiber` = 活跃实例，存储 `cells`（状态槽，类似 hooks）

```ts
// 调用 MyResource(props) 不会执行函数，只创建描述符
export function resource<R, P>(fn: (props: P) => R) {
  const type = (props?: P) => ({ type, props: props! });
  type[fnSymbol] = fn;
  return type;
}
```

### Hooks 系统（镜像 React）

| Tap hook | React 等价物 |
|---|---|
| `tapState` | `useState` |
| `tapReducer` | `useReducer`（含 eager 计算 + bailout） |
| `tapEffect` | `useEffect` |
| `tapMemo` | `useMemo` |
| `tapRef` | `useRef` |
| `tapCallback` | `useCallback` |
| `tapResource` | 嵌套渲染 |

### Scheduler

使用 `MessageChannel` 调度宏任务（与 React scheduler 相同技术）：

```ts
const channel = new MessageChannel();
channel.port1.onmessage = flushScheduled;
const schedule = () => channel.port2.postMessage(null);
```

`MAX_FLUSH_LIMIT = 50` 防止无限更新循环。

### 桥接 React

`tapResourceRoot` 暴露 `{ getValue(), subscribe() }` — 标准 subscribable store。
`useResource(element)` 通过 `useReducer` 触发 re-render，当 Tap fiber 更新时调用 React dispatch。

### 我们的替代方案

不采用 Tap。用 **Zustand + `useSyncExternalStore`** 实现同样的「React 外部状态 → React 组件」桥接，复杂度低 10 倍。

## 2. Subscribable 发布-订阅系统

`packages/core/src/subscribable/` 定义了核心的 pub-sub 原语：

| 类型 | 行为 |
|------|------|
| `BaseSubscribable` | 简单 pub-sub，`Set<Callback>` |
| `BaseSubject` | **惰性连接/断开**：仅在有订阅者时连接上游（引用计数） |
| `ShallowMemoizeSubject` | 浅比较，状态不变则不通知 |
| `LazyMemoizeSubject` | 推迟状态计算到 `getState()` 被调用时 |
| `NestedSubscriptionSubject` | 订阅嵌套 subscribable 的状态（如：当前 thread 的状态） |

`SKIP_UPDATE` 哨兵值允许 selector 跳过 re-render。

### 我们的替代方案

Zustand 的 `subscribe` + `selector` 已涵盖大部分场景。`BaseSubject` 的惰性连接模式可以在需要时简单实现。

## 3. MessageRepository（分支消息树）

`packages/core/src/runtime/utils/message-repository.ts`

每个 `RepositoryMessage` 存储：
- `prev` — 父消息引用
- `next` — 当前选中的子消息（跟随哪个分支）
- `children` — 该层所有分支（子消息 ID 数组）
- `level` — 树深度

**关键操作**：
- `switchToBranch(messageId)` → 设置 `parent.next = message`，向前遍历 `next` 找到叶节点
- `getMessages()` → 从 `head` 向上遍历 `prev` 到根，构建线性数组
- `CachedValue` 包装消息数组，脏标记 + 惰性重算

### 我们的实现

已在 `@agent-ui-sdk/core` 实现，采用类似的 Map + 链表结构，API：`addOrUpdateMessage`、`getBranches`、`switchToBranch`、`resetHead`、`getMessages`。

## 4. ThreadMessageConverter（WeakMap 缓存）

`packages/core/src/runtimes/external-store/thread-message-converter.ts`

```ts
class ThreadMessageConverter {
  private readonly cache = new WeakMap<WeakKey, ThreadMessage>();

  convertMessages<TIn extends WeakKey>(
    messages: readonly TIn[],
    converter: ConverterCallback<TIn>,
  ): ThreadMessage[] {
    return messages.map((m, idx) => {
      const cached = this.cache.get(m);
      const newMessage = converter(cached, m, idx);
      this.cache.set(m, newMessage);
      return newMessage;
    });
  }
}
```

源消息对象（如 AI SDK `UIMessage`）作为 WeakKey，converter 回调收到上次缓存结果做结构共享。AI SDK 的流式 in-place mutation 对象需要特殊处理。

### 我们的实现

放在 `@agent-ui-sdk/react-ai-sdk` 适配层，用于 AI SDK UIMessage → BaseMessage 转换。

## 5. 消息 Part 类型系统

`packages/core/src/types/message.ts`

**Assistant parts**：Text | Reasoning | ToolCall | Source | File | Image | Data

**`ToolCallMessagePart`** 携带：
- `toolCallId`、`toolName`、`args`（parsed）、`argsText`（raw，流式显示用）
- `result`、`isError`、`interrupt`（human-in-the-loop）
- `messages`（嵌套 thread，agent 子图支持）

**`MessageStatus`** 流转：`running → complete | incomplete | requires-action`

### 稳定化流式 Tool 参数

`stableStringifyToolArgs` 用 `keyOrderByPath` WeakMap 缓存 key 顺序，确保 streaming 时 JSON key 顺序稳定（新 key 追加不会导致已有 key 重排）。

`stripClosingDelimiters(argsText)` 去掉 AI SDK JSON fixer 加的尾部 `}` / `]`。

## 6. AI SDK 适配层

`packages/react-ai-sdk/src/ui/use-chat/useAISDKRuntime.ts`

### 状态映射

AI SDK status (`"submitted"` / `"streaming"`) + executing tool → `isRunning: boolean`

### 消息转换

| AI SDK Part | assistant-ui Part |
|---|---|
| `text` | `TextMessagePart` |
| `reasoning` | `ReasoningMessagePart` |
| `isToolUIPart(part)` | `ToolCallMessagePart`（状态映射） |
| `source-url` | `SourceMessagePart` |
| `data-xxx` | `DataMessagePart { name: xxx }` |

### 动作回调

| 操作 | 映射 |
|------|------|
| `onNew` | `chatHelpers.sendMessage()` |
| `onEdit` | slice messages + send |
| `onReload` | trim messages + regenerate |
| `onCancel` | `chatHelpers.stop()` |
| `onAddToolResult` | `chatHelpers.addToolOutput()` |

## 7. 流式动画 (Smooth Streaming)

`packages/react/src/utils/smooth/useSmooth.ts`

### TextStreamAnimator

```ts
class TextStreamAnimator {
  animate = () => {
    const remainingChars = this.targetText.length - this.currentText.length;
    const baseTimePerChar = Math.min(5, 250 / remainingChars);
    // 多字符待显示 → 加速追赶（250ms 内消化）
    // 少字符待显示 → 慢速显示（每字符最多 5ms）

    let charsToAdd = 0;
    while (timeToConsume >= baseTimePerChar && charsToAdd < remainingChars) {
      charsToAdd++;
      timeToConsume -= baseTimePerChar;
    }

    this.currentText = this.targetText.slice(0, this.currentText.length + charsToAdd);
    this.setText(this.currentText);

    if (charsToAdd !== remainingChars) {
      this.animationFrameId = requestAnimationFrame(this.animate);
    }
  };
}
```

### SmoothContextProvider

独立 Zustand store 跟踪动画状态。动画播放中：`{ type: "running" }` → 容器加 `data-status="running"` → CSS 打字圆点动画。消息完成后立即显示全文。

### CSS 打字指示器

```css
:where(.aui-md[data-status="running"]) > :last-child::after {
  animation: aui-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  content: "\25cf"; /* ● */
}
```

纯 CSS 实现，零 JS 开销。

## 8. Markdown 渲染

### react-markdown 方案 (`@assistant-ui/react-markdown`)

1. `withSmoothContextProvider` 包裹组件
2. `useMessagePartText()` 获取文本 → `useSmooth()` 动画处理
3. `components.code` 路由到 `CodeOverride` → 区分 code block vs inline code
4. `DefaultCodeBlock` 渲染 `CodeHeader` + `SyntaxHighlighter`
5. `memoizeMarkdownComponents` — 自定义 comparator 做 hast `Element` 结构相等比较，避免 position 变化触发重渲染

### Streamdown 方案 (`@assistant-ui/react-streamdown`)

基于 `streamdown` 库，专为 AI streaming 设计：block-based 渲染、remend 处理不完整 markdown、内置 Shiki 高亮。

## 9. React 组件架构

### Primitives

每个 UI 原语映射到一个领域概念：
- `ThreadPrimitive.Root/Viewport/Messages/ScrollToBottom/Suggestions`
- `MessagePrimitive.Root/Parts/If/Error/Attachments`
- `MessagePartPrimitive.Text/Image/InProgress`
- `ActionBarPrimitive.Root/Copy/Edit/Reload/FeedbackPositive/FeedbackNegative`
- `BranchPickerPrimitive.Root/Previous/Next/Number/Count`
- `ComposerPrimitive.Root/Input/Send/Cancel/Attachments`

### Tool UI 渲染

通过 `MessagePrimitive.Parts` 的 `tools` prop 配置：

```tsx
<MessagePrimitive.Parts
  components={{
    Text: MarkdownText,
    tools: {
      myTool: { Toolbar: RunningUI, Result: ResultUI },
      Fallback: ToolFallback,
    },
  }}
/>
```

`useAssistantToolUI` / `makeAssistantToolUI` 注册到 model context。

### 分支（Edit/Regenerate）

**Edit**：`beginEdit(messageId)` → 创建 `EditComposerRuntimeCore` → 发送新内容 → 在父节点创建新分支

**Regenerate**：`reload()` → `startRun({ parentId })` → 新 assistant 消息作为同级分支 → `switchToBranch` 切换

**导航**：`BranchPickerPrimitive.Previous/Next` 调用 `switchToBranch({ position })` → 改变 `parent.next` 指针。

## 10. 样式方案

- Tailwind CSS v4 + shadcn/ui 约定
- `aui-*` class names 作为稳定 CSS hook
- CSS 变量（`--thread-max-width`）用于布局定制
- `cn()` = `clsx` + `tailwind-merge`
- Radix UI primitives 提供无障碍基础
- `data-status` 属性实现纯 CSS 状态样式
- `:where()` 低优先级选择器方便用户覆盖
