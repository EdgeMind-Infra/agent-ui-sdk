/**
 * useAISDKRuntime — Bridge AI SDK's useChat return value to AgentUIProvider.
 *
 * Since core now uses UIMessage directly from AI SDK, no type conversion needed.
 * This hook syncs messages, status, error, and action callbacks to the store.
 */

import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useEffect, useMemo } from "react";
import { useHistoryAdapterContext, useThreadIdContext } from "../react/adapter-context";
import { useHistory } from "../react/hooks/use-history";
import { useAgentUIStoreApi } from "../react/provider";
import type { RuntimeActions } from "../react/store";

export type { UseChatHelpers } from "@ai-sdk/react";

export interface UseAISDKRuntimeOptions {
  /** The return value of AI SDK's useChat() */
  chatHelpers: UseChatHelpers<UIMessage>;
}

/**
 * Bridge AI SDK useChat to agent-ui-sdk's AgentUIProvider.
 *
 * Must be used inside <AgentUIProvider>.
 * Syncs messages, status, and action callbacks from AI SDK to the store.
 */
export function useAISDKRuntime({ chatHelpers }: UseAISDKRuntimeOptions): void {
  const store = useAgentUIStoreApi();

  // Bridge history persistence (no-op when adapter or threadId is not provided)
  const historyAdapter = useHistoryAdapterContext();
  const threadId = useThreadIdContext();
  useHistory({ adapter: historyAdapter, chatHelpers, threadId });

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
    return {
      onNew: (message) => {
        chatHelpers.sendMessage({ text: message.content });
      },

      onEdit: (messageId, content) => {
        const idx = chatHelpers.messages.findIndex((m) => m.id === messageId);
        if (idx === -1) return;

        chatHelpers.setMessages(chatHelpers.messages.slice(0, idx));
        chatHelpers.sendMessage({ text: content });
      },

      onRegenerate: () => {
        chatHelpers.regenerate();
      },

      onCancel: () => {
        chatHelpers.stop();
      },

      onToolApprovalResponse: (options) => {
        chatHelpers.addToolApprovalResponse(options);
      },
    };
  }, [chatHelpers]);

  // Sync actions to store
  useEffect(() => {
    store.getState().setActions(actions);
  }, [actions, store]);
}
