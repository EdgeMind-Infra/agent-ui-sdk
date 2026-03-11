"use client";

import type { ThreadHistoryAdapter } from "@agent-ui-sdk/core";
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
}

/**
 * Wraps ChatHelpers (from useChat) with automatic message branching support.
 *
 * Maintains a MessageRepository tree internally. When the user switches branches,
 * it syncs the active path back to useChat via setMessages().
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

  // Load history on mount / threadId change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only re-run on threadId change
  useEffect(() => {
    if (!historyAdapter || !threadId) return;

    let cancelled = false;
    historyAdapter.load(threadId).then((exported) => {
      if (cancelled || exported.length === 0) return;
      repository.import(exported);
      const messages = repository.getMessages();
      if (messages.length > 0 && chatHelpers.setMessages) {
        isInternalUpdateRef.current = true;
        // repository stores UIMessage[]; runtime shape is identical to UI_MESSAGE[]
        chatHelpers.setMessages(messages as UI_MESSAGE[]);
      }
      forceRender((n) => n + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [threadId]);

  // Sync incoming messages from useChat → repository
  useEffect(() => {
    // Skip if this update was triggered by us (branch switch)
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      prevMessagesRef.current = chatHelpers.messages;
      return;
    }

    const prev = prevMessagesRef.current;
    const curr = chatHelpers.messages;

    if (prev === curr) return;

    // Find new or updated messages
    for (let i = 0; i < curr.length; i++) {
      const message = curr[i]!;
      const existing = repository.getNode(message.id);

      if (existing) {
        // Update existing message (e.g. streaming updates)
        repository.addOrUpdateMessage(existing.parentId, message);
      } else {
        // New message — parent is the previous message in the list
        const parentId = i > 0 ? (curr[i - 1]?.id ?? null) : null;
        repository.addOrUpdateMessage(parentId, message);
      }
    }

    prevMessagesRef.current = curr;
    forceRender((n) => n + 1);

    // Persist if adapter is available — skip when messages are empty
    // to prevent overwriting stored history on initial mount
    if (historyAdapter && threadId && curr.length > 0) {
      historyAdapter.save(threadId, repository.export());
    }
  }, [chatHelpers.messages, repository, historyAdapter, threadId]);

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

      // Reset repository head to the given message (keep it as the last message).
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
    // Pass through chatHelpers
    messages: chatHelpers.messages,
    status: chatHelpers.status,
    sendMessage: chatHelpers.sendMessage,
    stop: chatHelpers.stop,
    error: chatHelpers.error,
    setMessages: chatHelpers.setMessages,
    regenerate: chatHelpers.regenerate,
    addToolApprovalResponse: chatHelpers.addToolApprovalResponse,

    // Branching additions
    getBranches,
    switchBranch,
    restoreCheckpoint,
  };
}
