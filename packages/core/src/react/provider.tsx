import { createContext, type ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";
import type { ThreadHistoryAdapter } from "../adapters/thread-history-adapter";
import type { ThreadListAdapter } from "../adapters/thread-list-adapter";
import type { MessageRepository, UIRegistry } from "../index";
import {
  HistoryAdapterContext,
  ThreadIdContext,
  ThreadListAdapterContext,
} from "./adapter-context";
import {
  type AgentUIStore,
  type AgentUIStoreApi,
  createAgentUIStore,
  type RuntimeActions,
} from "./store";

/** Context holding the Zustand store API */
const AgentUIStoreContext = createContext<AgentUIStoreApi | null>(null);

export interface AgentUIProviderProps {
  children: ReactNode;
  /** Optional pre-configured UIRegistry instance */
  registry?: UIRegistry;
  /** Optional pre-configured MessageRepository instance */
  repository?: MessageRepository;
  /** Optional initial runtime actions */
  actions?: RuntimeActions;
  /** Optional adapter for persisting thread message history */
  historyAdapter?: ThreadHistoryAdapter;
  /** Optional adapter for managing multiple threads */
  threadListAdapter?: ThreadListAdapter;
  /** Optional current thread ID (drives useHistory loading) */
  threadId?: string;
}

/** Root provider for Agent UI SDK — wraps your chat UI */
export function AgentUIProvider({
  children,
  registry,
  repository,
  actions,
  historyAdapter,
  threadListAdapter,
  threadId,
}: AgentUIProviderProps) {
  const storeRef = useRef<AgentUIStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createAgentUIStore({ registry, repository, actions });
  }

  return (
    <AgentUIStoreContext.Provider value={storeRef.current}>
      <HistoryAdapterContext.Provider value={historyAdapter ?? null}>
        <ThreadListAdapterContext.Provider value={threadListAdapter ?? null}>
          <ThreadIdContext.Provider value={threadId}>{children}</ThreadIdContext.Provider>
        </ThreadListAdapterContext.Provider>
      </HistoryAdapterContext.Provider>
    </AgentUIStoreContext.Provider>
  );
}

/** Get the raw Zustand store API (for advanced usage) */
export function useAgentUIStoreApi(): AgentUIStoreApi {
  const store = useContext(AgentUIStoreContext);
  if (!store) {
    throw new Error("useAgentUIStoreApi must be used within an <AgentUIProvider>");
  }
  return store;
}

/** Access the Agent UI store with a selector for precise subscriptions */
export function useAgentUI<T>(selector: (state: AgentUIStore) => T): T {
  const store = useAgentUIStoreApi();
  return useStore(store, selector);
}

// Convenience selectors
export const selectMessages = (s: AgentUIStore) => s.messages;
export const selectChatStatus = (s: AgentUIStore) => s.chatStatus;
export const selectIsRunning = (s: AgentUIStore) => s.isRunning;
export const selectRegistry = (s: AgentUIStore) => s.registry;
export const selectRepository = (s: AgentUIStore) => s.repository;
export const selectActions = (s: AgentUIStore) => s.actions;
