"use client";

import { ToolUIRegistry } from "@agent-ui-sdk/core";
import { createContext, use, useEffect, useMemo, useRef } from "react";
import type { ChatComponents, ChatConfig, ChatHelpers, ToolUIRendererComponent } from "../types";

/** chatHelpers 去掉随流式变化的三个字段后剩下的动作方法。 */
export type ChatActions = Omit<ChatHelpers, "messages" | "status" | "error">;

export interface ChatContextValue {
  chatHelpers: ChatHelpers;
  components: ChatComponents;
  config: ChatConfig;
  toolUIRegistry: ToolUIRegistry;
  toolRenderers?: Record<string, ToolUIRendererComponent>;
}

/**
 * chatHelpers 里只有 `messages` / `status` / `error` 会随流式 chunk 变化,
 * 其余部分(组件表、配置、动作方法)在一次会话里基本恒定。把它们拆成独立 context,
 * 消息卡片这类"只需要配置和动作"的组件就能订阅这一份而不被每个 token 惊动 ——
 * 否则 `memo()` 完全是摆设:context 变化会强制刷新所有消费者,memo 拦不住。
 */
export interface ChatStaticContextValue {
  components: ChatComponents;
  config: ChatConfig;
  toolUIRegistry: ToolUIRegistry;
  toolRenderers?: Record<string, ToolUIRendererComponent>;
  /** 转发到最新 chatHelpers 的动作方法,引用恒定。 */
  chatActions: ChatActions;
}

const ChatContext = createContext<ChatContextValue | null>(null);
const ChatStaticContext = createContext<ChatStaticContextValue | null>(null);

/**
 * 默认值必须是模块级常量:写成字面量会每次渲染换引用,把下面的 useMemo 全部作废。
 * 冻结是因为它被所有省略该 prop 的 `<Chat>` 实例共享 —— 谁往拿到的 config 上写一个字段,
 * 就会污染页面上其它所有会话。
 */
const EMPTY_COMPONENTS: ChatComponents = Object.freeze({});
const EMPTY_CONFIG: ChatConfig = Object.freeze({});

/**
 * 完整的 chat 上下文,包含随流式变化的 `chatHelpers`。
 * 只有真的要读 messages / status / error 的组件才该用它 —— 其它组件用 `useChatStatic()`。
 */
export function useChatContext(): ChatContextValue {
  const ctx = use(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used within a <ChatProvider>");
  }
  return ctx;
}

/** 不含 messages/status/error 的稳定上下文。流式期间不会变,配合 memo 使用。 */
export function useChatStatic(): ChatStaticContextValue {
  const ctx = use(ChatStaticContext);
  if (!ctx) {
    throw new Error("useChatStatic must be used within a <ChatProvider>");
  }
  return ctx;
}

export interface ChatProviderProps {
  chatHelpers: ChatHelpers;
  components?: ChatComponents;
  config?: ChatConfig;
  toolRenderers?: Record<string, ToolUIRendererComponent>;
  children: React.ReactNode;
}

export function ChatProvider({
  chatHelpers,
  components = EMPTY_COMPONENTS,
  config = EMPTY_CONFIG,
  toolRenderers,
  children,
}: ChatProviderProps) {
  const registryRef = useRef<ToolUIRegistry>(null);
  if (!registryRef.current) {
    registryRef.current = new ToolUIRegistry();
  }
  const registry = registryRef.current;

  // 在 effect 里更新而不是渲染期直接赋值:渲染期写 ref 在并发渲染下不安全(一次被丢弃的
  // 渲染会把 ref 指向从未 commit 的对象)。转发只发生在用户交互回调里,必然晚于 commit。
  const helpersRef = useRef(chatHelpers);
  useEffect(() => {
    helpersRef.current = chatHelpers;
  });

  // 可选方法要保住"底层没提供就是 undefined"的语义 —— 消费者(如 ChatMessage 决定要不要
  // 渲染审批按钮)是靠 `if (!fn) return undefined` 判断能力的,无脑包一层永远 truthy 的
  // 转发函数会把"不支持"悄悄变成"支持但点了没反应"。所以按存在性建对象:引用只在能力翻转
  // 时才变(实践中一次挂载内不会变),仍然满足 static context 的稳定性要求。
  const hasSetMessages = !!chatHelpers.setMessages;
  const hasRegenerate = !!chatHelpers.regenerate;
  const hasToolApproval = !!chatHelpers.addToolApprovalResponse;
  const hasToolOutput = !!chatHelpers.addToolOutput;

  const chatActions = useMemo<ChatActions>(
    () => ({
      sendMessage: (message) => helpersRef.current.sendMessage(message),
      stop: () => helpersRef.current.stop(),
      setMessages: hasSetMessages
        ? (messages) => helpersRef.current.setMessages?.(messages)
        : undefined,
      regenerate: hasRegenerate
        ? (options) => helpersRef.current.regenerate?.(options) ?? Promise.resolve()
        : undefined,
      addToolApprovalResponse: hasToolApproval
        ? (opts) => helpersRef.current.addToolApprovalResponse?.(opts)
        : undefined,
      addToolOutput: hasToolOutput
        ? (opts) => helpersRef.current.addToolOutput?.(opts) ?? Promise.resolve()
        : undefined,
    }),
    [hasSetMessages, hasRegenerate, hasToolApproval, hasToolOutput],
  );

  const staticValue = useMemo<ChatStaticContextValue>(
    () => ({
      components,
      config,
      toolUIRegistry: registry,
      toolRenderers,
      chatActions,
    }),
    [components, config, toolRenderers, chatActions, registry],
  );

  const value = useMemo<ChatContextValue>(
    () => ({
      chatHelpers,
      components,
      config,
      toolUIRegistry: registry,
      toolRenderers,
    }),
    [chatHelpers, components, config, toolRenderers, registry],
  );

  return (
    <ChatStaticContext value={staticValue}>
      <ChatContext value={value}>{children}</ChatContext>
    </ChatStaticContext>
  );
}
