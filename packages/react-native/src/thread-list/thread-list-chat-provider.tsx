import type { ThreadHistoryAdapter, ThreadListAdapter } from "@agent-ui-sdk/core";
import type { ReactNode } from "react";
import { ChatProvider, type ChatProviderProps } from "../chat/chat-provider";
import { type UseBranchedChatReturn, useBranchedChat } from "../hooks/use-branched-chat";
import type { ChatHelpers } from "../types";
import { ThreadListProvider, useThreadList } from "./thread-list-provider";

export interface ThreadListChatProviderProps {
  /** The chatHelpers from useChat(). Must include setMessages for branching. */
  chatHelpers: ChatHelpers;
  /** Adapter for managing the thread list (CRUD operations). */
  threadListAdapter: ThreadListAdapter;
  /** Adapter for persisting thread messages. */
  historyAdapter: ThreadHistoryAdapter;
  /** ChatProvider props (components, config). */
  chatProviderProps?: Omit<ChatProviderProps, "chatHelpers" | "children">;
  children: ReactNode;
}

/**
 * Combines ThreadListProvider + ChatProvider.
 * When the active thread changes, useBranchedChat re-loads messages from historyAdapter.
 */
export function ThreadListChatProvider({
  chatHelpers,
  threadListAdapter,
  historyAdapter,
  chatProviderProps,
  children,
}: ThreadListChatProviderProps) {
  return (
    <ThreadListProvider threadListAdapter={threadListAdapter}>
      <InnerChatBridge
        chatHelpers={chatHelpers}
        historyAdapter={historyAdapter}
        chatProviderProps={chatProviderProps}
      >
        {children}
      </InnerChatBridge>
    </ThreadListProvider>
  );
}

interface InnerChatBridgeProps {
  chatHelpers: ChatHelpers;
  historyAdapter: ThreadHistoryAdapter;
  chatProviderProps?: Omit<ChatProviderProps, "chatHelpers" | "children">;
  children: ReactNode;
}

function InnerChatBridge({
  chatHelpers,
  historyAdapter,
  chatProviderProps,
  children,
}: InnerChatBridgeProps) {
  const { activeThreadId } = useThreadList();

  const branched: UseBranchedChatReturn = useBranchedChat({
    chatHelpers,
    historyAdapter,
    threadId: activeThreadId ?? undefined,
  });

  return (
    <ChatProvider
      chatHelpers={branched}
      components={chatProviderProps?.components}
      config={{
        ...chatProviderProps?.config,
      }}
    >
      {children}
    </ChatProvider>
  );
}
