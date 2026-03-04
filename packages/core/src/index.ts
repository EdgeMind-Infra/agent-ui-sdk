// @agent-ui-sdk/core
// Platform-agnostic core for Agent UI SDK

// Part Grouping — declarative message part grouping engine
export { type GroupRule, groupParts, type PartGroup } from "./grouping";
export type { BranchState, MessageNode } from "./message-repository";
// Message Repository — branch-aware message tree (like ChatGPT edit/regenerate)
export { MessageRepository } from "./message-repository";
// Types — shared message types
export type {
  BaseMessage,
  DataPart,
  MessagePart,
  ReasoningPart,
  SourcePart,
  TextPart,
  ToolCallPart,
} from "./types";
export type { DataUIRegistration, ToolUIRegistration, UIRegistryState } from "./ui-registry";
// UI Registry — register custom Tool/Data renderers dynamically
export { createUIRegistry, UIRegistry } from "./ui-registry";
