# Vercel AI Elements 架构分析

> 调研日期：2026-03-04
> 仓库：https://github.com/vercel/ai-elements（v1.8.4）
> 文档站：https://elements.ai-sdk.dev

## 项目定位

AI Elements 是 Vercel 官方提供的 **AI 原生组件库**，基于 shadcn/ui 构建。与 assistant-ui 的「headless 框架」定位不同，AI Elements 走的是 **"Copy-paste 组件集"** 路线——通过 shadcn CLI 将组件源码直接复制到消费者项目中。

**核心理念**：不是 npm 包，而是 **registry**。组件代码属于你的项目，可以随意修改。

## Monorepo 结构

```
ai-elements/
├── apps/
│   └── docs/              # Next.js 16 文档站（fumadocs）
├── packages/
│   ├── cli/               # npx ai-elements add <component>
│   ├── elements/          # 核心组件源码（~48 个组件）
│   ├── examples/          # 示例代码（chatbot, demo-chatgpt, demo-claude 等）
│   ├── shadcn-ui/         # shadcn/ui 组件的本地 fork
│   ├── scripts/           # 内部脚本
│   └── typescript-config/ # 共享 tsconfig
├── turbo.json             # Turborepo 2.7 编排
└── pnpm-workspace.yaml
```

### 工程化对比

| 关注点 | AI Elements | agent-ui-sdk |
|--------|-------------|-------------|
| 包管理 | pnpm 10 | pnpm 10 |
| 编排 | Turborepo 2.7 | Turborepo 2 |
| 构建 | Next.js（仅 docs） | tsdown（库输出） |
| Lint | oxlint + ultracite | Biome 2 |
| 测试 | Vitest 4 + Playwright | Vitest 3 |
| 版本 | Changesets | Changesets + git-cliff |
| 分发 | shadcn registry（源码复制） | npm 包（ESM+CJS） |

## 核心组件分析

### 1. Message（消息组件）

```
Message
├── MessageContent          # 消息内容容器
├── MessageResponse         # Streamdown markdown 渲染（memo 优化）
├── MessageActions          # 操作按钮栏
├── MessageAction           # 单个操作按钮（带 Tooltip）
├── MessageToolbar          # 底部工具栏
├── MessageBranch           # 分支容器（Context Provider）
│   ├── MessageBranchContent    # 分支内容切换
│   ├── MessageBranchSelector   # 分支选择器
│   ├── MessageBranchPrevious   # 上一个分支
│   ├── MessageBranchNext       # 下一个分支
│   └── MessageBranchPage       # "1 of 3" 页码
```

**特点**：
- 直接依赖 AI SDK 的 `UIMessage` 类型
- `MessageResponse` 是 memo 化的 Streamdown 封装，一行代码搞定 AI 流式 markdown
- 分支通过 React Context + `useState` 实现，**非常简单**（无 MessageRepository 树结构）
- 角色通过 CSS class `is-user` / `is-assistant` 区分，用 `group-[.is-user]:` Tailwind 选择器做样式

### 2. Conversation（对话容器）

```
Conversation
├── ConversationContent     # 消息列表区域
├── ConversationEmptyState  # 空状态
├── ConversationScrollButton # 滚动到底部按钮
└── ConversationDownload    # 下载对话为 markdown
```

**特点**：
- 使用 `use-stick-to-bottom` 库（非 react-virtuoso）实现 **粘底滚动**
- **没有虚拟化**——对于一般对话长度这是合理的简化
- 滚动按钮通过 `useStickToBottomContext` 感知是否在底部

### 3. Tool（工具调用展示）

```
Tool（Collapsible 折叠面板）
├── ToolHeader    # 工具名 + 状态 Badge + 展开/折叠
├── ToolContent   # 展开内容
├── ToolInput     # 参数展示（JSON → CodeBlock）
└── ToolOutput    # 结果/错误展示
```

**特点**：
- 直接使用 AI SDK 的 `ToolUIPart` 和 `DynamicToolUIPart` 类型
- 7 种状态映射（`input-streaming` → `output-available` → `output-error` 等）
- 每种状态有独立的 icon + label
- 不是 registry 模式——没有 `useToolUI` 注册机制，而是直接按 toolName 渲染

### 4. Confirmation（人机确认）

```
Confirmation
├── ConfirmationTitle
├── ConfirmationRequest    # 条件渲染：仅 approval-requested
├── ConfirmationAccepted   # 条件渲染：仅已批准
├── ConfirmationRejected   # 条件渲染：仅已拒绝
└── ConfirmationActions    # 批准/拒绝按钮
```

**特点**：
- 专为 AI SDK v6 的 Tool Approval 机制设计
- Context + 条件渲染模式：子组件根据 `state` 自动显示/隐藏

### 5. CodeBlock（代码块）

```
CodeBlock
├── CodeBlockContainer     # 外层容器
├── CodeBlockHeader        # 头部（语言标签 + 操作按钮）
├── CodeBlockTitle         # 标题区
├── CodeBlockFilename      # 文件名
├── CodeBlockActions       # 操作按钮区
├── CodeBlockContent       # 代码内容（异步高亮）
├── CodeBlockCopyButton    # 复制按钮
└── CodeBlockLanguageSelector # 语言选择器
```

**特点**：
- 自行实现 Shiki 高亮（非 @streamdown/code），原因是需要更精细控制
- **异步加载 + 缓存**：`highlighterCache`（按语言单例）+ `tokensCache`（代码片段缓存）
- **渐进增强**：先显示原始文本（`createRawTokens`），高亮完成后替换
- 支持行号、暗色模式（CSS 变量 `--shiki-dark`）
- CSS `content-visibility: auto` 优化长代码块渲染

### 6. Reasoning（推理过程）

```
Reasoning（Collapsible）
├── ReasoningTrigger    # "Thinking..." / "Thought for X seconds"
└── ReasoningContent    # 推理内容（Streamdown 渲染）
```

**特点**：
- 自动行为：流式时自动展开，完成后 1 秒自动折叠
- 计时器：记录推理时长并显示
- `Shimmer` 动画组件用于 "Thinking..." 状态
- 使用 `@radix-ui/react-use-controllable-state` 支持受控/非受控模式

### 7. PromptInput（输入框）

最复杂的组件（~1340 行），功能包括：
- 文件附件管理（本地状态 or Provider 提升）
- 引用来源管理
- 粘贴/拖拽上传
- 文件类型/大小验证
- Blob URL → Data URL 转换
- IME 输入法兼容（`compositionstart/end`）
- Backspace 删除最后一个附件
- 提交按钮状态（submitted → streaming → error）
- 命令面板（cmdk 集成）
- 下拉菜单操作

### 8. 其他组件

| 组件 | 功能 |
|------|------|
| `Attachments` | 附件展示（grid/inline/list 三种布局） |
| `Sources` | 引用来源折叠面板 |
| `Suggestion` | 建议提示词（横向滚动） |
| `ChainOfThought` | 思维链展示 |
| `InlineCitation` | 行内引用标注 |
| `Canvas` | XY-Flow 画布 |
| `Terminal` | ANSI 终端输出 |
| `FileTree` | 文件树 |
| `AudioPlayer` | 音频播放器 |
| `SpeechInput` | 语音输入 |
| `Image` | 图片展示（支持缩放） |
| `Sandbox` | 代码沙盒预览 |
| `JSXPreview` | JSX 实时预览 |
| `Persona` | AI 人设 avatar |
| `ModelSelector` | 模型选择器 |

## Streamdown 集成方式

```tsx
// message.tsx
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import { Streamdown } from "streamdown";

const streamdownPlugins = { cjk, code, math, mermaid };

export const MessageResponse = memo(
  ({ className, ...props }: MessageResponseProps) => (
    <Streamdown
      className={cn("size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0", className)}
      plugins={streamdownPlugins}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);
```

**关键模式**：
1. 插件对象在模块顶层定义（避免重建）
2. `memo` + 自定义比较函数（仅比较 `children` 字符串）
3. `children` 是 markdown 字符串，由 AI SDK `useChat` 流式更新
4. 同一个 plugins 配置在 `MessageResponse` 和 `ReasoningContent` 中复用

## AI SDK 集成

AI Elements **深度绑定** AI SDK v6：

| 类型依赖 | 使用场景 |
|----------|---------|
| `UIMessage` | Message 组件的 `from` prop |
| `ChatStatus` | PromptInput 提交按钮状态 |
| `ToolUIPart` / `DynamicToolUIPart` | Tool 组件状态映射 |
| `FileUIPart` | 附件类型 |
| `SourceDocumentUIPart` | 引用来源类型 |

**没有适配层**——直接使用 AI SDK 类型，不做转换。这是 "Vercel 全家桶" 策略。

## CLI 和 Registry 分发机制

### CLI（`packages/cli/index.js`）

极简实现（~60 行）：
```js
// npx ai-elements add message
// ↓ 转换为
// npx shadcn@latest add https://elements.ai-sdk.dev/api/registry/message.json
```

本质上是 shadcn CLI 的 **URL 代理**——将组件名映射到 registry URL。

### Registry API（`apps/docs/app/api/registry/[component]/route.ts`）

动态生成 shadcn 兼容的 registry JSON：

1. 读取 `packages/elements/src/*.tsx` 源码
2. 替换内部路径（`@repo/shadcn-ui/` → `@/registry/default/ui/`）
3. 用 `ts-morph` 解析 import 提取依赖
4. 返回 shadcn `RegistryItem` 格式的 JSON

支持：
- `/api/registry/registry.json` — 组件列表
- `/api/registry/message.json` — 单个组件
- `/api/registry/all.json` — 打包所有组件

### 依赖解析

Registry 会自动：
- 提取 npm 依赖（streamdown, shiki, motion 等）
- 提取 `@types/*` devDependencies
- 提取 shadcn/ui 组件依赖（button, tooltip 等）
- 提取 AI Elements 内部依赖（组件间引用）

## 与 agent-ui-sdk 的对比

### 架构定位

| 维度 | AI Elements | agent-ui-sdk |
|------|-------------|-------------|
| 分发方式 | 源码复制（registry） | npm 包 |
| 样式绑定 | Tailwind + shadcn/ui | Headless（零样式） |
| AI SDK 绑定 | 硬绑定 v6 类型 | 可选适配层 |
| 平台 | Web only | Web + RN |
| 状态管理 | React useState | Zustand + MessageRepository |
| 分支 | 简单 UI 切换 | 完整分支树结构 |
| Tool UI | 静态组件 | Registry 动态注册 |
| 流式优化 | streamdown 内置 | StreamAnimator（core） |
| 虚拟化 | 无（use-stick-to-bottom） | react-virtuoso / FlashList |

### AI Elements 的优势

1. **即用即走**：`npx ai-elements add message` 一行命令，组件代码直接到项目里
2. **Vercel 全家桶**：AI SDK + streamdown + Next.js 无缝集成
3. **丰富的组件**：48 个专用组件覆盖几乎所有 AI 交互场景
4. **设计品质**：shadcn/ui 级别的视觉设计
5. **可定制**：源码在你手里，想改就改

### AI Elements 的局限

1. **Web Only**：没有 React Native 支持
2. **Tailwind 必须**：强依赖 Tailwind CSS
3. **样式耦合**：组件带着 shadcn/ui 样式，不适合已有设计系统的项目
4. **无逻辑层复用**：没有独立的 core 包，逻辑和 UI 混在一起
5. **AI SDK 硬绑定**：不支持其他后端
6. **简化的分支**：只有 UI 级别的分支切换，无数据层支持

### agent-ui-sdk 的差异化

1. **核心逻辑可复用**：`@agent-ui-sdk/core` 零依赖纯 TS，任何框架可用
2. **跨平台**：React Web + React Native 共享逻辑层
3. **Headless 设计**：不绑定 UI 框架，消费者自由组合
4. **完整分支树**：MessageRepository 支持 ChatGPT 级别的 edit/regenerate
5. **动态注册**：Tool UI / Data UI registry 支持运行时注册

## 可参考的模式

### 值得借鉴

| 模式 | 说明 | 应用位置 |
|------|------|---------|
| Streamdown memo 封装 | 模块级 plugins + memo 自定义比较 | `@agent-ui-sdk/react` |
| Reasoning 自动展开/折叠 | 流式时展开，完成 1s 后折叠 | Reasoning primitive |
| PromptInput 分层架构 | Provider(可选) → 本地状态 → attachments 管理 | Composer primitive |
| Shiki 异步缓存 | highlighter 单例 + token 缓存 + 渐进增强 | CodeBlock primitive |
| Tool 状态映射 | 7 种 AI SDK Tool 状态 → icon + label | Tool UI 组件 |
| Confirmation 条件渲染 | Context + 子组件按 state 自动显示/隐藏 | Confirmation primitive |
| Attachment 多布局 | grid/inline/list 三种变体通过 Context 传递 | Attachment primitive |
| `contentVisibility: auto` | CSS 优化长代码块渲染 | CodeBlock |
| IME 兼容 | `compositionstart/end` 阻止 Enter 提交 | Composer input |

### 不借鉴

| 模式 | 原因 |
|------|------|
| shadcn registry 分发 | 我们做 npm 包，不做源码复制 |
| 硬绑定 AI SDK 类型 | 我们需要 AI SDK 适配层隔离 |
| 内联 Tailwind 样式 | 我们做 headless，由消费者加样式 |
| 无虚拟化 | 我们需要支持大量消息场景 |
| useState 分支管理 | 我们用 MessageRepository 支持真实分支树 |

## 组件清单（全部 48 个）

```
agent.tsx            # Agent 流程展示
artifact.tsx         # 制品（代码/文档）
attachments.tsx      # 附件管理
audio-player.tsx     # 音频播放器
canvas.tsx           # XY-Flow 画布
chain-of-thought.tsx # 思维链
checkpoint.tsx       # 检查点
code-block.tsx       # 代码块
commit.tsx           # Git commit
confirmation.tsx     # 人机确认
connection.tsx       # 连接状态
context.tsx          # 上下文面板
controls.tsx         # 控制面板
conversation.tsx     # 对话容器
edge.tsx             # 画布连线
environment-variables.tsx # 环境变量
file-tree.tsx        # 文件树
image.tsx            # 图片
inline-citation.tsx  # 行内引用
jsx-preview.tsx      # JSX 预览
message.tsx          # 消息
mic-selector.tsx     # 麦克风选择
model-selector.tsx   # 模型选择
node.tsx             # 画布节点
open-in-chat.tsx     # 在聊天中打开
package-info.tsx     # 包信息
panel.tsx            # 面板
persona.tsx          # AI 人设
plan.tsx             # 计划展示
prompt-input.tsx     # 输入框
queue.tsx            # 队列
reasoning.tsx        # 推理过程
sandbox.tsx          # 代码沙盒
schema-display.tsx   # Schema 展示
shimmer.tsx          # 闪光动画
snippet.tsx          # 代码片段
sources.tsx          # 引用来源
speech-input.tsx     # 语音输入
stack-trace.tsx      # 堆栈跟踪
suggestion.tsx       # 建议提示
task.tsx             # 任务
terminal.tsx         # 终端
test-results.tsx     # 测试结果
tool.tsx             # 工具调用
toolbar.tsx          # 工具栏
transcription.tsx    # 转录
voice-selector.tsx   # 语音选择
web-preview.tsx      # 网页预览
```
