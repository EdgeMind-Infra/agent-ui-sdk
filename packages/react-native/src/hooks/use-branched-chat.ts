import type { ExportedMessage, ThreadHistoryAdapter } from "@agent-ui-sdk/core";
import { MessageRepository } from "@agent-ui-sdk/core";
import type { UIMessage } from "ai";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatHelpers } from "../types";

export interface UseBranchedChatOptions<UI_MESSAGE extends UIMessage = UIMessage> {
  /** The chatHelpers from useChat(). Must include setMessages for branch switching. */
  chatHelpers: ChatHelpers<UI_MESSAGE>;
  /** Optional persistence adapter for thread history. */
  historyAdapter?: ThreadHistoryAdapter;
  /** Thread ID for persistence. Required when historyAdapter is provided. */
  threadId?: string;
}

export interface UseBranchedChatReturn<UI_MESSAGE extends UIMessage = UIMessage>
  extends ChatHelpers<UI_MESSAGE> {
  /** Get all branch versions for a message (including itself). */
  getBranches: (messageId: string) => UIMessage[];
  /** Switch to a specific branch by message ID. */
  switchBranch: (messageId: string) => void;
  /** Restore checkpoint: truncates conversation to after a given message. */
  restoreCheckpoint: (messageId: string) => void;
  /** Whether history is currently being loaded from the adapter. */
  isHistoryLoading: boolean;
}

/**
 * Wraps ChatHelpers (from useChat) with automatic message branching support.
 *
 * Maintains a MessageRepository tree internally. When the user switches branches,
 * it syncs the active path back to useChat via setMessages().
 *
 * Persistence strategy:
 * - New messages (first appearance of an ID) → immediate append
 * - Updated messages (same ID, content changed) → debounced append (300ms)
 */
export function useBranchedChat<UI_MESSAGE extends UIMessage = UIMessage>({
  chatHelpers,
  historyAdapter,
  threadId,
}: UseBranchedChatOptions<UI_MESSAGE>): UseBranchedChatReturn<UI_MESSAGE> {
  const [repository] = useState(() => new MessageRepository());
  const prevMessagesRef = useRef<UI_MESSAGE[]>([]);
  const isInternalUpdateRef = useRef(false);
  const [, forceRender] = useState(0);
  const [isHistoryLoading, setIsHistoryLoading] = useState(!!historyAdapter && !!threadId);

  // Tracking for append + debounce persistence
  const knownMessageIdsRef = useRef(new Set<string>());
  const pendingUpdatesRef = useRef(new Map<string, ExportedMessage>());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flush pending debounced updates
  const flushPendingUpdates = useCallback(() => {
    if (!historyAdapter || !threadId) return;
    const pending = pendingUpdatesRef.current;
    if (pending.size === 0) return;

    const messages = [...pending.values()];
    pending.clear();
    historyAdapter.append(threadId, messages);
  }, [historyAdapter, threadId]);

  // Schedule a debounced flush
  const scheduleDebouncedFlush = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      flushPendingUpdates();
    }, 300);
  }, [flushPendingUpdates]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        flushPendingUpdates();
      }
    };
  }, [flushPendingUpdates]);

  // Reset known IDs when threadId changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only re-run on threadId change
  useEffect(() => {
    knownMessageIdsRef.current.clear();
    pendingUpdatesRef.current.clear();
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, [threadId]);

  // Load history on mount / threadId change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only re-run on threadId change
  useEffect(() => {
    if (!historyAdapter || !threadId) {
      setIsHistoryLoading(false);
      return;
    }

    setIsHistoryLoading(true);
    let cancelled = false;
    historyAdapter.load(threadId).then((exported) => {
      if (cancelled) return;
      if (exported.length === 0) {
        setIsHistoryLoading(false);
        return;
      }
      repository.import(exported);
      for (const msg of exported) {
        knownMessageIdsRef.current.add(msg.message.id);
      }
      const messages = repository.getMessages();
      if (messages.length > 0 && chatHelpers.setMessages) {
        isInternalUpdateRef.current = true;
        chatHelpers.setMessages(messages as UI_MESSAGE[]);
      }
      setIsHistoryLoading(false);
      forceRender((n) => n + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [threadId]);

  // Sync incoming messages from useChat → repository
  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      prevMessagesRef.current = chatHelpers.messages;
      return;
    }

    const prev = prevMessagesRef.current;
    const curr = chatHelpers.messages;

    if (prev === curr) return;

    const newMessages: ExportedMessage[] = [];

    for (let i = 0; i < curr.length; i++) {
      const message = curr[i]!;
      const existing = repository.getNode(message.id);

      if (existing) {
        repository.addOrUpdateMessage(existing.parentId, message);

        if (historyAdapter && threadId) {
          pendingUpdatesRef.current.set(message.id, {
            message,
            parentId: existing.parentId,
          });
          scheduleDebouncedFlush();
        }
      } else {
        const parentId = i > 0 ? (curr[i - 1]?.id ?? null) : null;
        repository.addOrUpdateMessage(parentId, message);
        knownMessageIdsRef.current.add(message.id);

        newMessages.push({ message, parentId });
      }
    }

    prevMessagesRef.current = curr;
    forceRender((n) => n + 1);

    if (historyAdapter && threadId && newMessages.length > 0) {
      historyAdapter.append(threadId, newMessages);
    }
  }, [chatHelpers.messages, repository, historyAdapter, threadId, scheduleDebouncedFlush]);

  const getBranches = useCallback(
    (messageId: string): UIMessage[] => {
      return repository.getBranches(messageId);
    },
    [repository],
  );

  const switchBranch = useCallback(
    (messageId: string) => {
      if (!chatHelpers.setMessages) {
        console.warn("useBranchedChat: setMessages is required for branch switching");
        return;
      }

      repository.switchToBranch(messageId);
      const messages = repository.getMessages() as UI_MESSAGE[];

      isInternalUpdateRef.current = true;
      chatHelpers.setMessages(messages);
      prevMessagesRef.current = messages;
      forceRender((n) => n + 1);
    },
    [repository, chatHelpers],
  );

  const restoreCheckpoint = useCallback(
    (messageId: string) => {
      if (!chatHelpers.setMessages) {
        console.warn("useBranchedChat: setMessages is required for checkpoint restore");
        return;
      }

      repository.resetHead(messageId);

      const truncated = repository.getMessages() as UI_MESSAGE[];
      isInternalUpdateRef.current = true;
      chatHelpers.setMessages(truncated);
      prevMessagesRef.current = truncated;
      forceRender((n) => n + 1);
    },
    [repository, chatHelpers],
  );

  return {
    messages: chatHelpers.messages,
    status: chatHelpers.status,
    sendMessage: chatHelpers.sendMessage,
    stop: chatHelpers.stop,
    error: chatHelpers.error,
    setMessages: chatHelpers.setMessages,
    regenerate: chatHelpers.regenerate,

    getBranches,
    switchBranch,
    restoreCheckpoint,
    isHistoryLoading,
  };
}
