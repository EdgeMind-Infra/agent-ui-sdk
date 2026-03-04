import { createContext, type ReactNode, useContext, useRef } from "react";
import { useStore } from "zustand";
import type { MessageRepository, UIRegistry } from "../index";
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
}

/** Root provider for Agent UI SDK — wraps your chat UI */
export function AgentUIProvider({ children, registry, repository, actions }: AgentUIProviderProps) {
  const storeRef = useRef<AgentUIStoreApi | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createAgentUIStore({ registry, repository, actions });
  }

  return (
    <AgentUIStoreContext.Provider value={storeRef.current}>{children}</AgentUIStoreContext.Provider>
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
