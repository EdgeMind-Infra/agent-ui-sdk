"use client";

import { createContext, use } from "react";
import type { ChatComponents, ChatConfig, ChatHelpers } from "../types";

export interface ChatContextValue {
  chatHelpers: ChatHelpers;
  components: ChatComponents;
  config: ChatConfig;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const ctx = use(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used within a <ChatProvider>");
  }
  return ctx;
}

export interface ChatProviderProps {
  chatHelpers: ChatHelpers;
  components?: ChatComponents;
  config?: ChatConfig;
  children: React.ReactNode;
}

export function ChatProvider({
  chatHelpers,
  components = {},
  config = {},
  children,
}: ChatProviderProps) {
  return <ChatContext value={{ chatHelpers, components, config }}>{children}</ChatContext>;
}
