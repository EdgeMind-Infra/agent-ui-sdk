"use client";

import { ToolUIRegistry } from "@agent-ui-sdk/core";
import { createContext, use, useRef } from "react";
import type { ChatComponents, ChatConfig, ChatHelpers, ToolUIRendererComponent } from "../types";

export interface ChatContextValue {
  chatHelpers: ChatHelpers;
  components: ChatComponents;
  config: ChatConfig;
  toolUIRegistry: ToolUIRegistry;
  toolRenderers?: Record<string, ToolUIRendererComponent>;
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
  toolRenderers?: Record<string, ToolUIRendererComponent>;
  children: React.ReactNode;
}

export function ChatProvider({
  chatHelpers,
  components = {},
  config = {},
  toolRenderers,
  children,
}: ChatProviderProps) {
  const registryRef = useRef<ToolUIRegistry>(null);
  if (!registryRef.current) {
    registryRef.current = new ToolUIRegistry();
  }

  return (
    <ChatContext
      value={{
        chatHelpers,
        components,
        config,
        toolUIRegistry: registryRef.current,
        toolRenderers,
      }}
    >
      {children}
    </ChatContext>
  );
}
