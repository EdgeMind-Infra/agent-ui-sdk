import type { UseChatHelpers } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { useCallback, useEffect, useRef } from "react";
import type { ThreadHistoryAdapter } from "../../adapters/thread-history-adapter";
import { useAgentUIStoreApi } from "../provider";

export interface UseHistoryOptions {
  adapter: ThreadHistoryAdapter | null;
  chatHelpers: UseChatHelpers<UIMessage>;
  threadId: string | undefined;
}

/**
 * useHistory — bridges ai-sdk useChat with ThreadHistoryAdapter.
 *
 * - On mount / threadId change: loads history via adapter.load()
 * - On run finish (status streaming/submitted → ready): appends new messages via adapter.append()
 * - No-op when adapter or threadId is null/undefined
 */
export function useHistory({ adapter, chatHelpers, threadId }: UseHistoryOptions): void {
  const store = useAgentUIStoreApi();

  // Track which message IDs have already been persisted (loaded from history or appended)
  const historyIdsRef = useRef<Set<string>>(new Set());
  const prevStatusRef = useRef<string>(chatHelpers.status);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load history when adapter and threadId are available (or threadId changes)
  useEffect(() => {
    if (!adapter || !threadId) return;

    let cancelled = false;
    const { setIsLoading } = store.getState();

    setIsLoading(true);
    historyIdsRef.current.clear();

    adapter.load(threadId).then(
      ({ messages }) => {
        if (cancelled) return;
        // Mark loaded messages as already persisted
        for (const msg of messages) {
          historyIdsRef.current.add(msg.id);
        }
        chatHelpers.setMessages(messages);
        setIsLoading(false);
      },
      () => {
        if (cancelled) return;
        setIsLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [adapter, threadId, store, chatHelpers.setMessages]);

  // Persist new messages when run finishes (status transitions to ready)
  const appendNewMessages = useCallback(() => {
    if (!adapter || !threadId) return;

    const messages = chatHelpers.messages;
    for (const msg of messages) {
      if (!historyIdsRef.current.has(msg.id)) {
        historyIdsRef.current.add(msg.id);
        adapter.append(threadId, msg);
      }
    }
  }, [adapter, threadId, chatHelpers.messages]);

  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    const currentStatus = chatHelpers.status;
    prevStatusRef.current = currentStatus;

    if (!adapter || !threadId) return;

    // Detect transition: streaming/submitted → ready
    const wasRunning = prevStatus === "streaming" || prevStatus === "submitted";
    const isNowReady = currentStatus === "ready";

    if (wasRunning && isNowReady) {
      // Debounce with setTimeout(0) to absorb multi-step agentic flickering
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        appendNewMessages();
        debounceRef.current = null;
      }, 0);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [chatHelpers.status, adapter, threadId, appendNewMessages]);
}
