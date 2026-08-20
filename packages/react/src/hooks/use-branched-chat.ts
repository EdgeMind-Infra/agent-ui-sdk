"use client";

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
  /** How many branch versions a message has. Allocation-free — prefer it for "are there
   *  branches?" checks, which message lists run once per message per render. */
  getBranchCount: (messageId: string) => number;
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
  // chatHelpers 每次渲染都是新对象(useChat 返回值 + 调用方 spread 包装)。
  // 下面的 callback 若把它写进 deps,switchBranch/restoreCheckpoint 就会每帧换引用,
  // 一路把 ChatConfig → ChatContext value 也带成新对象 → 整条消息列表的 memo 全部失效。
  // 同 chat-provider:在 effect 里更新,避免渲染期写 ref(并发渲染下被丢弃的渲染会留下
  // 指向未 commit 对象的 ref)。读取点都是用户交互回调,必然晚于 commit。
  const chatHelpersRef = useRef(chatHelpers);
  useEffect(() => {
    chatHelpersRef.current = chatHelpers;
  });
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
        // Flush remaining updates on unmount
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
      // Mark all loaded message IDs as known
      for (const msg of exported) {
        knownMessageIdsRef.current.add(msg.message.id);
      }
      const messages = repository.getMessages();
      if (messages.length > 0 && chatHelpers.setMessages) {
        isInternalUpdateRef.current = true;
        // repository stores UIMessage[]; runtime shape is identical to UI_MESSAGE[]
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
    // Skip if this update was triggered by us (branch switch)
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      prevMessagesRef.current = chatHelpers.messages;
      return;
    }

    const prev = prevMessagesRef.current;
    const curr = chatHelpers.messages;

    if (prev === curr) return;

    const newMessages: ExportedMessage[] = [];

    // Find new or updated messages
    for (let i = 0; i < curr.length; i++) {
      const message = curr[i]!;
      const existing = repository.getNode(message.id);

      if (existing) {
        // 流式期间 useChat 只替换正在生成的那一条,其余历史消息保持同一对象引用。
        // 靠引用比较跳过它们 —— 否则每个 chunk 都要 O(总消息数) 地重写整棵树,
        // 并把全部历史消息塞进待持久化队列(结果是每 300ms 把整段会话 POST 一遍)。
        if (existing.message === message) continue;

        // Update existing message (e.g. streaming updates)
        repository.addOrUpdateMessage(existing.parentId, message);

        // Queue updated message for debounced append
        if (historyAdapter && threadId) {
          pendingUpdatesRef.current.set(message.id, {
            message,
            parentId: existing.parentId,
          });
          scheduleDebouncedFlush();
        }
      } else {
        // New message — parent is the previous message in the list
        const parentId = i > 0 ? (curr[i - 1]?.id ?? null) : null;
        repository.addOrUpdateMessage(parentId, message);
        knownMessageIdsRef.current.add(message.id);

        // Collect for immediate append
        newMessages.push({ message, parentId });
      }
    }

    prevMessagesRef.current = curr;

    // 只有可见路径的结构变了才需要重渲染 —— 新消息入树(getBranches 多出兄弟),或者消息被
    // 截断(regenerate 会先砍掉助手那一轮,此时每条幸存消息都是同一引用、newMessages 为空,
    // 只有长度变化能看出来)。流式内容更新不碰结构,消息本身早已由 useChat 自己推给了 UI。
    // 每个 chunk 都 forceRender 的代价不是"多渲染一次"那么轻:它发生在 commit 阶段
    // (SyncLane 更新会同步 flush passive effect),于是每次 commit 结束时 root 都还挂着
    // pending 更新 → React 的 nestedUpdateCount 永远归不了零 → 消息一多、渲染一慢,
    // 连续 50 次之后下一个 setState 直接抛 "Maximum update depth exceeded"(#185)。
    if (newMessages.length > 0 || curr.length !== prev.length) {
      forceRender((n) => n + 1);
    }

    // Immediately append new messages
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

  const getBranchCount = useCallback(
    (messageId: string): number => {
      return repository.getBranchCount(messageId);
    },
    [repository],
  );

  const switchBranch = useCallback(
    (messageId: string) => {
      const setMessages = chatHelpersRef.current.setMessages;
      if (!setMessages) {
        console.warn("useBranchedChat: setMessages is required for branch switching");
        return;
      }

      repository.switchToBranch(messageId);
      const messages = repository.getMessages() as UI_MESSAGE[];

      isInternalUpdateRef.current = true;
      setMessages(messages);
      prevMessagesRef.current = messages;
      forceRender((n) => n + 1);
    },
    [repository],
  );

  const restoreCheckpoint = useCallback(
    (messageId: string) => {
      const setMessages = chatHelpersRef.current.setMessages;
      if (!setMessages) {
        console.warn("useBranchedChat: setMessages is required for checkpoint restore");
        return;
      }

      // Reset repository head to the given message (keep it as the last message).
      repository.resetHead(messageId);

      const truncated = repository.getMessages() as UI_MESSAGE[];
      isInternalUpdateRef.current = true;
      setMessages(truncated);
      prevMessagesRef.current = truncated;
      forceRender((n) => n + 1);
    },
    [repository],
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
    addToolOutput: chatHelpers.addToolOutput,

    // Branching additions
    getBranches,
    getBranchCount,
    switchBranch,
    restoreCheckpoint,
    isHistoryLoading,
  };
}
