import { createUIRegistry, MessageRepository, type UIRegistry } from "@agent-ui-sdk/core";
import { createContext, type ReactNode, useContext, useMemo } from "react";

interface AgentUIContextValue {
  registry: UIRegistry;
  repository: MessageRepository;
}

const AgentUIContext = createContext<AgentUIContextValue | null>(null);

export interface AgentUIProviderProps {
  children: ReactNode;
  registry?: UIRegistry;
  repository?: MessageRepository;
}

/** Root provider for Agent UI SDK (React Native) */
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
