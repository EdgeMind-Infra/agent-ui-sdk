/**
 * Core types — re-exports AI SDK v6 UIMessage types as the canonical types.
 *
 * Also provides convenience aliases and backward-compatible deprecated aliases.
 */

// ---------------------------------------------------------------------------
// AI SDK type re-exports
// ---------------------------------------------------------------------------

export type {
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
} from "ai";

export {
  getStaticToolName,
  getToolName,
  isDataUIPart,
  isFileUIPart,
  isReasoningUIPart,
  isStaticToolUIPart,
  isTextUIPart,
  isToolUIPart,
} from "ai";

/** Check if a message part is a dynamic tool part */
export function isDynamicToolUIPart(part: {
  type: string;
}): part is import("ai").DynamicToolUIPart {
  return part.type === "dynamic-tool";
}

// ---------------------------------------------------------------------------
// Convenience aliases (default generics)
// ---------------------------------------------------------------------------

import type { UIDataTypes, UIMessage, UIMessagePart, UITools } from "ai";

/** UIMessage with all defaults — the most common usage */
export type AnyUIMessage = UIMessage;

/** UIMessagePart with all defaults */
export type AnyUIMessagePart = UIMessagePart<UIDataTypes, UITools>;

/** Extract the data part name from a DataUIPart (strips 'data-' prefix) */
export function getDataPartName(part: { type: string }): string {
  return part.type.startsWith("data-") ? part.type.slice(5) : part.type;
}
