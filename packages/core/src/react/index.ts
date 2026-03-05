// @agent-ui-sdk/core/react
// Shared React code for both Web and React Native

// Adapter Contexts
export {
  useHistoryAdapterContext,
  useThreadIdContext,
  useThreadListAdapterContext,
} from "./adapter-context";
// Hooks
export type { UseDataUIOptions } from "./hooks/use-data-ui";
export { useDataUI } from "./hooks/use-data-ui";
export { useGroupedParts } from "./hooks/use-grouped-parts";
export type { UseHistoryOptions } from "./hooks/use-history";
export { useHistory } from "./hooks/use-history";
export { useMessageBranch } from "./hooks/use-message-branch";
export { useSegmentCache } from "./hooks/use-segment-cache";
export type { UseThreadListReturn } from "./hooks/use-thread-list";
export { useThreadList } from "./hooks/use-thread-list";
export type { UseToolUIOptions } from "./hooks/use-tool-ui";
export { useToolUI } from "./hooks/use-tool-ui";
// Provider
export type { AgentUIProviderProps } from "./provider";
export {
  AgentUIProvider,
  selectActions,
  selectChatStatus,
  selectIsRunning,
  selectMessages,
  selectRegistry,
  selectRepository,
  useAgentUI,
  useAgentUIStoreApi,
} from "./provider";
// Store
export type {
  AgentUIActions,
  AgentUIState,
  AgentUIStore,
  AgentUIStoreApi,
  ChatStatus,
  CreateAgentUIStoreOptions,
  RuntimeActions,
} from "./store";
export { createAgentUIStore } from "./store";
