# 组件对比分析：AI Elements vs assistant-ui vs agent-ui-sdk

> 调研日期：2026-03-04
> 目的：确定 agent-ui-sdk 应实现哪些组件，从 AI Elements 和 assistant-ui 中各取什么

## 三者定位对比

| 维度 | AI Elements | assistant-ui | agent-ui-sdk（目标） |
|------|-------------|-------------|---------------------|
| 本质 | 带样式的组件集（shadcn 风格） | Headless UI 框架 | Headless UI 库 |
| 分发 | 源码复制（shadcn registry） | npm 包 | npm 包 |
| 样式 | Tailwind 硬编码 | data-* + aui-* CSS hooks | Headless + 可选主题包 |
| 状态管理 | React useState | 自建 Tap 响应式系统 | Zustand + useSyncExternalStore |
| AI SDK 依赖 | 硬绑定 v6 类型 | 适配层隔离 | 适配层隔离 |
| 平台 | Web only | Web only | Web + React Native |
| 组件数量 | ~48 个 | ~16 个 Primitives | 精选核心 Primitives |

## 组件级对比

### 核心对话组件

| 功能 | AI Elements | assistant-ui | agent-ui-sdk 建议 |
|------|-------------|-------------|-------------------|
| **对话容器** | `Conversation`（use-stick-to-bottom） | `ThreadPrimitive.Root/Viewport`（react-virtuoso） | **Thread primitive** — Web 用 react-virtuoso，RN 用 FlashList |
| **消息** | `Message`（简单 div + CSS class） | `MessagePrimitive.Root/If`（Context 驱动） | **Message primitive** — Context 提供 role/status/parts |
| **消息内容** | `MessageContent`（带样式容器） | `MessagePrimitive.Parts`（part 遍历） | **MessageParts primitive** — 遍历 + GroupingEngine 分组 |
| **Markdown** | `MessageResponse`（memo Streamdown） | `MarkdownText`（react-markdown/streamdown） | **MarkdownRenderer** — Web 用 streamdown，RN 用 react-native-marked |
| **输入框** | `PromptInput`（~1340行，全功能） | `ComposerPrimitive.Root/Input/Send`（headless） | **Composer primitive** — headless 输入/发送/取消/附件 |
| **操作栏** | `MessageActions/MessageAction` | `ActionBarPrimitive.Root/Copy/Edit/Reload` | **ActionBar primitive** — 复制/编辑/重新生成/反馈 |
| **分支** | `MessageBranch*`（UI 级切换） | `BranchPickerPrimitive`（数据层驱动） | **BranchPicker primitive** — 基于 MessageRepository |
| **建议** | `Suggestion`（简单按钮） | `ThreadPrimitive.Suggestions` | **Suggestion primitive** — 建议列表 |
| **空状态** | `ConversationEmptyState` | `ThreadPrimitive.Empty` | **Thread.Empty primitive** |
| **滚动按钮** | `ConversationScrollButton` | `ThreadPrimitive.ScrollToBottom` | **Thread.ScrollToBottom primitive** |

### AI 特有组件

| 功能 | AI Elements | assistant-ui | agent-ui-sdk 建议 |
|------|-------------|-------------|-------------------|
| **工具调用** | `Tool`（Collapsible 面板） | `MessagePrimitive.Parts` + `useToolUI` | **ToolCall primitive** + UIRegistry 注册制 |
| **推理过程** | `Reasoning`（自动展开/折叠+计时） | `ChainOfThoughtPrimitive` / `Reasoning` | **Reasoning primitive** — 参考 AI Elements 的自动行为 |
| **确认/审批** | `Confirmation`（请求/接受/拒绝） | 无独立组件（通过 ToolUI 实现） | **Confirmation primitive** — human-in-the-loop |
| **代码块** | `CodeBlock`（Shiki 异步缓存） | `CodeBlock`（Shiki/streamdown） | **CodeBlock primitive** — Web 参考 AI Elements 的缓存策略 |
| **引用来源** | `Sources`（Collapsible 列表） | 无独立组件 | **Sources primitive** |
| **附件** | `Attachments`（grid/inline/list） | `AttachmentPrimitive`（headless） | **Attachment primitive** — 多布局变体 |
| **行内引用** | `InlineCitation` | 无 | 可选，后续实现 |

### 扩展组件

| 功能 | AI Elements | assistant-ui | agent-ui-sdk 建议 |
|------|-------------|-------------|-------------------|
| **思维链** | `ChainOfThought` | `ChainOfThoughtPrimitive` | 后续版本 |
| **Agent 流程** | `Agent`（流程图） | 无 | 后续版本 |
| **画布** | `Canvas`（XY-Flow） | 无 | 不实现（超出范围） |
| **终端** | `Terminal`（ANSI） | 无 | 不实现 |
| **文件树** | `FileTree` | 无 | 不实现 |
| **音频** | `AudioPlayer` / `SpeechInput` | 无 | 后续版本 |
| **JSX 预览** | `JSXPreview` | 无 | 不实现 |
| **模型选择** | `ModelSelector` | 无 | 不实现（消费者自行实现） |
| **对话下载** | `ConversationDownload` | `ActionBar.ExportMarkdown` | 后续考虑 |
| **对话列表** | 无 | `ThreadListPrimitive` | 后续版本 |
| **Persona** | `Persona`（AI avatar） | 无 | 不实现 |
| **错误显示** | 无独立组件 | `ErrorPrimitive` | **Error primitive** |

## 从 AI Elements 参考的具体实现

### 1. Reasoning 自动行为（强烈推荐）

AI Elements 的 `Reasoning` 组件有非常好的 UX 细节：

```tsx
// 流式时自动展开
useEffect(() => {
  if (isStreaming && !isOpen && !isExplicitlyClosed) setIsOpen(true);
}, [isStreaming, isOpen]);

// 完成后 1 秒自动折叠（仅一次）
useEffect(() => {
  if (!isStreaming && isOpen && !hasAutoClosed) {
    const timer = setTimeout(() => {
      setIsOpen(false);
      setHasAutoClosed(true);
    }, AUTO_CLOSE_DELAY);
    return () => clearTimeout(timer);
  }
}, [isStreaming, isOpen, hasAutoClosed]);

// 计时器
if (isStreaming) startTimeRef.current ??= Date.now();
else setDuration(Math.ceil((Date.now() - startTimeRef.current) / 1000));
```

**agent-ui-sdk 应用**：在 Reasoning primitive 的 hooks 层实现 `useReasoningAutoCollapse(isStreaming)`。

### 2. Streamdown memo 模式（强烈推荐）

```tsx
const streamdownPlugins = { cjk, code, math, mermaid }; // 模块级常量

export const MessageResponse = memo(
  (props) => <Streamdown plugins={streamdownPlugins} {...props} />,
  (prev, next) => prev.children === next.children // 只比较 markdown 字符串
);
```

**agent-ui-sdk 应用**：在 `@agent-ui-sdk/react` 的 MarkdownRenderer 中采用相同模式。

### 3. CodeBlock 异步缓存策略（推荐）

```tsx
// 按语言的 Highlighter 单例
const highlighterCache = new Map<string, Promise<HighlighterGeneric>>();
// 代码片段的 Token 缓存
const tokensCache = new Map<string, TokenizedCode>();
// 异步订阅更新
const subscribers = new Map<string, Set<(result) => void>>();
```

渐进增强流程：
1. 初始显示原始文本（无高亮）
2. 异步加载 Shiki highlighter
3. Token 化后通过 subscriber 回调更新 UI
4. 后续相同代码直接命中缓存

**agent-ui-sdk 应用**：在 CodeBlock primitive 中实现，作为 `useCodeHighlight(code, language)` hook。

### 4. PromptInput 分层架构（推荐）

```
PromptInputProvider（可选，提升状态）
  └── PromptInput（可独立工作）
       ├── 文本状态（受控 or 本地）
       ├── 附件管理（Provider 级 or 本地级）
       ├── 引用来源管理（始终本地）
       └── 文件验证（类型/大小/数量）
```

**agent-ui-sdk 应用**：Composer primitive 采用相同的 "Provider 可选提升" 模式。

### 5. Confirmation 条件渲染模式（推荐）

```tsx
<Confirmation state={part.state} approval={part.approval}>
  <ConfirmationTitle>Allow file access?</ConfirmationTitle>
  <ConfirmationRequest>Waiting for your approval...</ConfirmationRequest>
  <ConfirmationAccepted>Access granted</ConfirmationAccepted>
  <ConfirmationRejected>Access denied</ConfirmationRejected>
  <ConfirmationActions>
    <ConfirmationAction onClick={approve}>Allow</ConfirmationAction>
    <ConfirmationAction onClick={deny}>Deny</ConfirmationAction>
  </ConfirmationActions>
</Confirmation>
```

子组件根据 `state` 自动显示/隐藏，声明式 API 非常优雅。

### 6. Tool 状态映射（推荐）

7 种工具状态的 icon + label 映射是通用的 UX 标准：

```tsx
const statusLabels = {
  "approval-requested": "Awaiting Approval",
  "approval-responded": "Responded",
  "input-available": "Running",
  "input-streaming": "Pending",
  "output-available": "Completed",
  "output-denied": "Denied",
  "output-error": "Error",
};
```

### 7. Attachment 多布局变体（参考）

通过 Context 传递 `variant`，所有子组件自适应：

```tsx
<Attachments variant="grid">    // 网格布局
<Attachments variant="inline">  // 行内标签
<Attachments variant="list">    // 列表布局
```

### 8. IME 兼容处理（必须）

```tsx
const [isComposing, setIsComposing] = useState(false);
// ...
onCompositionStart={() => setIsComposing(true)}
onCompositionEnd={() => setIsComposing(false)}
// Enter 时检查
if (isComposing || e.nativeEvent.isComposing) return;
```

## 从 assistant-ui 参考的具体实现

### 1. MessageRepository 分支树（已实现）

完整的分支消息数据结构，支持 edit/regenerate/navigate。

### 2. UIRegistry 注册制（已实现）

运行时注册 Tool UI / Data UI 渲染器，栈式优先级。

### 3. GroupingEngine（已实现）

声明式 part 分组规则，连续相同类型合并。

### 4. StreamAnimator（待实现）

自适应速度的流式文本动画算法，放在 core 包。

### 5. Primitive + Context 架构

assistant-ui 的 `Primitive.Root` + 各子组件模式：

```tsx
<MessagePrimitive.Root>
  <MessagePrimitive.If user>...</MessagePrimitive.If>
  <MessagePrimitive.If assistant>
    <MessagePrimitive.Parts components={{ Text, tools: { ... } }} />
  </MessagePrimitive.If>
</MessagePrimitive.Root>
```

**agent-ui-sdk 简化版**：不做 Radix 级别的完整 Primitive 体系，但保留 Root + Context + 条件子组件模式。

### 6. WeakMap 消息转换缓存

在 AI SDK 适配层实现，避免流式 in-place mutation 导致重建开销。

### 7. memoized markdown 组件

hast Element 结构相等比较，避免 position 变化触发重渲染。

## agent-ui-sdk 实现路线图

### Phase 1：核心 Primitives（MVP）

| 组件 | 参考来源 | 核心功能 |
|------|---------|---------|
| **Thread** | assistant-ui | Root, Messages, Empty, ScrollToBottom |
| **Message** | assistant-ui + AI Elements | Root, Parts, If(role), Actions |
| **Composer** | AI Elements PromptInput 架构 | Root, Input, Send, Cancel |
| **BranchPicker** | assistant-ui | Previous, Next, Count, Number |
| **ActionBar** | assistant-ui + AI Elements | Copy, Edit, Reload, Feedback |

### Phase 2：AI 交互组件

| 组件 | 参考来源 | 核心功能 |
|------|---------|---------|
| **ToolCall** | AI Elements Tool + UIRegistry | Header, Content, Input, Output, 状态映射 |
| **Reasoning** | AI Elements | Trigger, Content, 自动展开/折叠/计时 |
| **Confirmation** | AI Elements | Request, Accepted, Rejected, Actions |
| **Sources** | AI Elements | Trigger, Content, Source |
| **CodeBlock** | AI Elements | Container, Header, Content, CopyButton, 异步缓存 |
| **Attachment** | AI Elements + assistant-ui | Preview, Info, Remove, grid/inline/list 变体 |

### Phase 3：增强功能

| 组件 | 参考来源 | 核心功能 |
|------|---------|---------|
| **Suggestion** | AI Elements + assistant-ui | 建议列表 |
| **Error** | assistant-ui | 错误显示 |
| **ChainOfThought** | 两者 | 多步推理展示 |
| **MarkdownRenderer** | AI Elements streamdown 集成 | Web/RN 统一 API |
| **ChatList** | 两者 | Web virtuoso / RN FlashList |

### Phase 4：扩展（按需）

- 对话列表（ThreadList）
- 语音输入/播放
- 选中工具栏（SelectionToolbar）
- 对话导出

## 每个 Primitive 的跨平台策略

| Primitive | Web 实现 | RN 实现 | 共享层（core） |
|-----------|---------|---------|--------------|
| Thread | react-virtuoso | FlashList | 消息状态管理 |
| Message | div + data-* | View + style | 角色/状态逻辑 |
| Composer | textarea + form | TextInput | 输入状态/附件管理 |
| BranchPicker | button | Pressable | MessageRepository 操作 |
| ActionBar | button | Pressable | 操作回调定义 |
| ToolCall | Collapsible(Radix) | Animated.View | 状态映射 |
| Reasoning | Collapsible(Radix) | Animated.View | 自动行为逻辑 |
| CodeBlock | Shiki | highlight.js | 代码解析 |
| Markdown | streamdown | react-native-marked | content string |
| Attachment | img/div | Image/View | 文件类型检测 |

## 结论

agent-ui-sdk 应该走 **"assistant-ui 的架构深度 + AI Elements 的 UX 细节"** 路线：

- **架构层**：从 assistant-ui 学习 MessageRepository、UIRegistry、GroupingEngine、StreamAnimator
- **组件层**：从 AI Elements 学习 Reasoning 自动行为、Confirmation 模式、CodeBlock 缓存、PromptInput 分层
- **差异化**：跨平台（Web + RN）、headless（零样式）、AI SDK 解耦（可选适配层）
