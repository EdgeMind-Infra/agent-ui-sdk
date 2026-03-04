// @agent-ui-sdk/react
// React web bindings for Agent UI SDK

// Re-export core types
export type {
  BaseMessage,
  DataPart,
  GroupRule,
  MessagePart,
  PartGroup,
  ReasoningPart,
  SourcePart,
  TextPart,
  ToolCallPart,
} from "@agent-ui-sdk/core";
export { useDataUI } from "./hooks/use-data-ui";
// Part grouping hook
export { useGroupedParts } from "./hooks/use-grouped-parts";
// Message hooks — branching & navigation
export { useMessageBranch } from "./hooks/use-message-branch";
// Segment cache
export { useSegmentCache } from "./hooks/use-segment-cache";
// Registry hooks — register custom Tool/Data renderers
export { useToolUI } from "./hooks/use-tool-ui";
// Context & Provider
export { AgentUIProvider, useAgentUI } from "./provider";
