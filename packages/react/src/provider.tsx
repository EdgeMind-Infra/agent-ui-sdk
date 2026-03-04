import { createUIRegistry, MessageRepository, type UIRegistry } from "@agent-ui-sdk/core";
import { createContext, type ReactNode, useContext, useMemo } from "react";

interface AgentUIContextValue {
  registry: UIRegistry;
  repository: MessageRepository;
}

const AgentUIContext = createContext<AgentUIContextValue | null>(null);

export interface AgentUIProviderProps {
  children: ReactNode;
  /** Optional pre-configured UIRegistry instance */
  registry?: UIRegistry;
  /** Optional pre-configured MessageRepository instance */
  repository?: MessageRepository;
}

/** Root provider for Agent UI SDK — wraps your chat UI */
export function AgentUIProvider({ children, registry, repository }: AgentUIProviderProps) {
  const value = useMemo(
    () => ({
      registry: registry ?? createUIRegistry(),
      repository: repository ?? new MessageRepository(),
    }),
    [registry, repository],
  );

  return <AgentUIContext.Provider value={value}>{children}</AgentUIContext.Provider>;
}

/** Access the Agent UI context */
export function useAgentUI(): AgentUIContextValue {
  const ctx = useContext(AgentUIContext);
  if (!ctx) {
    throw new Error("useAgentUI must be used within an <AgentUIProvider>");
  }
  return ctx;
}
