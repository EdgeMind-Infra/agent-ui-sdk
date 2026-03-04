/**
 * useAISDKRuntime — Bridge AI SDK's useChat return value to AgentUIProvider.
 *
 * Since core now uses UIMessage directly from AI SDK, no type conversion needed.
 * This hook syncs messages, status, error, and action callbacks to the store.
 */

import { useEffect, useMemo } from "react";
import type { ChatStatus, UIMessage } from "../index";
import { useAgentUIStoreApi } from "../react/provider";
import type { RuntimeActions } from "../react/store";

/** Minimal shape of AI SDK useChat return value */
export interface AISDKChatHelpers {
  messages: UIMessage[];
  status: ChatStatus;
  error?: Error | null;
  sendMessage?: (input: { text: string }) => void;
  append?: (message: { role: "user"; content: string }) => void;
  stop?: () => void;
  reload?: () => void;
  regenerate?: () => void;
  setMessages?: (messages: UIMessage[]) => void;
  addToolResult?: (options: { toolCallId: string; result: unknown }) => void;
}

export interface UseAISDKRuntimeOptions {
  /** The return value of AI SDK's useChat() */
  chatHelpers: AISDKChatHelpers;
}

/**
 * Bridge AI SDK useChat to agent-ui-sdk's AgentUIProvider.
 *
 * Must be used inside <AgentUIProvider>.
 * Syncs messages, status, and action callbacks from AI SDK to the store.
 */
export function useAISDKRuntime({ chatHelpers }: UseAISDKRuntimeOptions): void {
  const store = useAgentUIStoreApi();

  // Sync messages — no conversion needed, UIMessage is the canonical type
  useEffect(() => {
    store.getState().setMessages(chatHelpers.messages);
  }, [chatHelpers.messages, store]);

  // Sync status — ChatStatus is identical between AI SDK and core
  useEffect(() => {
    store.getState().setChatStatus(chatHelpers.status);
  }, [chatHelpers.status, store]);

  // Sync error
  useEffect(() => {
    store.getState().setError(chatHelpers.error ?? null);
  }, [chatHelpers.error, store]);

  // Map actions
  const actions: RuntimeActions = useMemo(() => {
    const send =
      chatHelpers.sendMessage ??
      (chatHelpers.append
        ? (input: { text: string }) => chatHelpers.append!({ role: "user", content: input.text })
        : undefined);

    return {
      onNew: (message) => {
        send?.({ text: message.content });
      },

      onEdit: (messageId, content) => {
        const messages = chatHelpers.messages;
        const idx = messages.findIndex((m) => m.id === messageId);
        if (idx === -1) return;

        const sliced = messages.slice(0, idx);
        chatHelpers.setMessages?.(sliced);
        send?.({ text: content });
      },

      onReload: () => {
        (chatHelpers.regenerate ?? chatHelpers.reload)?.();
      },

      onCancel: () => {
        chatHelpers.stop?.();
      },

      onAddToolResult: (toolCallId, result) => {
        chatHelpers.addToolResult?.({ toolCallId, result });
      },
    };
  }, [chatHelpers]);

  // Sync actions to store
  useEffect(() => {
    store.getState().setActions(actions);
  }, [actions, store]);
}
