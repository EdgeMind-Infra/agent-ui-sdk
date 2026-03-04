/**
 * Shared message and part types — platform-agnostic.
 *
 * These types are designed to be compatible with AI SDK v6's UIMessage
 * but do not depend on it directly, allowing framework-agnostic usage.
 */

/** A single text content part */
export interface TextPart {
  type: "text";
  text: string;
}

/** A reasoning/thinking part (CoT) */
export interface ReasoningPart {
  type: "reasoning";
  text: string;
  /** Whether the reasoning is still streaming */
  isStreaming?: boolean;
}

/** A tool call part */
export interface ToolCallPart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: unknown;
  result?: unknown;
  state?: "partial-call" | "call" | "result" | "error";
  /** Parent tool call ID for nested agent patterns */
  parentToolCallId?: string;
}

/** A named data part (for custom UI rendering) */
export interface DataPart<T = unknown> {
  type: "data";
  name: string;
  data: T;
}

/** A source/citation part */
export interface SourcePart {
  type: "source";
  url: string;
  title?: string;
  description?: string;
}

/** Union of all supported message part types */
export type MessagePart = TextPart | ReasoningPart | ToolCallPart | DataPart | SourcePart;

/** Role of a message */
export type MessageRole = "user" | "assistant" | "system";

/** A single message in a conversation */
export interface BaseMessage {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  createdAt?: Date;
  metadata?: Record<string, unknown>;
}
