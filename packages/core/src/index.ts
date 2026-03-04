// @agent-ui-sdk/core
// Platform-agnostic core for Agent UI SDK

// ---------------------------------------------------------------------------
// Part Grouping — declarative message part grouping engine
// ---------------------------------------------------------------------------
export { type GroupRule, groupParts, type PartGroup } from "./grouping";
// ---------------------------------------------------------------------------
// Message Repository — branch-aware message tree (like ChatGPT edit/regenerate)
// ---------------------------------------------------------------------------
export type { BranchState, MessageNode } from "./message-repository";
export { MessageRepository } from "./message-repository";
// ---------------------------------------------------------------------------
// Stream Animator — adaptive-speed text animation (platform-agnostic)
// ---------------------------------------------------------------------------
export { StreamAnimator, type StreamAnimatorOptions } from "./stream-animator";
// ---------------------------------------------------------------------------
// Tool Call State — AI SDK tool state mapping
// ---------------------------------------------------------------------------
export {
  isToolCallPendingApproval,
  isToolCallTerminal,
  type ToolCallStatus,
  toolStatusIcons,
  toolStatusLabels,
} from "./tool-call-state";
// ---------------------------------------------------------------------------
// AI SDK types (re-exported from core for convenience)
// ---------------------------------------------------------------------------
export type {
  AnyUIMessage,
  AnyUIMessagePart,
  ChatStatus,
  DataUIPart,
  DynamicToolUIPart,
  FileUIPart,
  ReasoningUIPart,
  SourceDocumentUIPart,
  SourceUrlUIPart,
  StepStartUIPart,
  TextUIPart,
  ToolUIPart,
  UIDataTypes,
  UIMessage,
  UIMessagePart,
  UIToolInvocation,
  UITools,
} from "./types";
export {
  getDataPartName,
  getStaticToolName,
  getToolName,
  isDataUIPart,
  isDynamicToolUIPart,
  isFileUIPart,
  isReasoningUIPart,
  isStaticToolUIPart,
  isTextUIPart,
  isToolUIPart,
} from "./types";

// ---------------------------------------------------------------------------
// UI Registry — register custom Tool/Data renderers dynamically
// ---------------------------------------------------------------------------
export type { DataUIRegistration, ToolUIRegistration, UIRegistryState } from "./ui-registry";
export { createUIRegistry, UIRegistry } from "./ui-registry";
