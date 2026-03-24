import type { ChatStatus, FileUIPart, UIMessage } from "ai";
import type { ComponentType } from "react";
import type { ViewProps } from "react-native";

/**
 * Subset of useChat() return value that Chat component needs.
 */
export interface ChatHelpers<UI_MESSAGE extends UIMessage = UIMessage> {
  messages: UI_MESSAGE[];
  status: ChatStatus;
  sendMessage: (message: { text: string; files?: FileUIPart[] }) => void;
  stop: () => void;
  error: Error | undefined;
  /** Set messages directly (from useChat). Needed for branch switching. */
  setMessages?: (messages: UI_MESSAGE[] | ((prev: UI_MESSAGE[]) => UI_MESSAGE[])) => void;
  /** Regenerate assistant response (from useChat). Needed for regeneration. */
  regenerate?: (options?: { messageId?: string }) => Promise<void>;
}

/**
 * Configuration for Chat features.
 */
export interface ChatConfig {
  /** Enable thinking/reasoning mode toggle button. */
  enableThinking?: boolean;
  /** Whether thinking mode is currently active. */
  thinkingActive?: boolean;
  /** Called when thinking mode is toggled. */
  onThinkingToggle?: (active: boolean) => void;

  /** Enable web search toggle button. */
  enableWebSearch?: boolean;
  /** Whether web search is currently active. */
  webSearchActive?: boolean;
  /** Called when web search is toggled. */
  onWebSearchToggle?: (active: boolean) => void;

  /** Regenerate the assistant response. */
  onRegenerate?: (messageId: string) => void;
  /** Copy message text. Uses RN Clipboard by default. */
  onCopy?: (messageId: string, text: string) => void;
}

/**
 * Props for the ChatMessage component.
 */
export interface ChatMessageProps {
  message: UIMessage;
  isLastMessage: boolean;
  isStreaming: boolean;
}

/**
 * Props for the ChatInput component.
 */
export interface ChatInputProps {
  className?: string;
  placeholder?: string;
}

/**
 * Props for the ChatMessages component.
 */
export interface ChatMessagesProps {
  className?: string;
}

/**
 * Props for part renderers.
 */
export interface TextPartProps {
  text: string;
  messageId: string;
  partIndex: number;
}

export interface ReasoningPartProps {
  text: string;
  isStreaming: boolean;
}

export interface ToolPartProps {
  part: {
    type: string;
    toolName?: string;
    toolCallId: string;
    state: string;
    input?: unknown;
    output?: unknown;
    errorText?: string;
  };
  messageId: string;
  partIndex: number;
}

export interface SourcePartProps {
  sources: Array<{
    sourceId: string;
    url: string;
    title?: string;
  }>;
}

/**
 * Map of replaceable sub-components.
 */
export interface ChatComponents {
  Message?: ComponentType<ChatMessageProps>;
  Messages?: ComponentType<ChatMessagesProps>;
  Input?: ComponentType<ChatInputProps>;
  TextPart?: ComponentType<TextPartProps>;
  ReasoningPart?: ComponentType<ReasoningPartProps>;
  ToolPart?: ComponentType<ToolPartProps>;
  SourcePart?: ComponentType<SourcePartProps>;
}

/**
 * Props for a custom tool UI renderer.
 */
export interface ToolUIProps<TArgs = unknown, TResult = unknown> {
  input: TArgs;
  output: TResult;
  state: string;
  toolCallId: string;
  toolName: string;
  messageId: string;
  partIndex: number;
}

/**
 * A React component that renders a custom tool UI.
 */
export type ToolUIRendererComponent<TArgs = unknown, TResult = unknown> = ComponentType<
  ToolUIProps<TArgs, TResult>
>;

/**
 * Props for the top-level Chat component.
 */
export interface ChatProps extends ViewProps {
  chatHelpers: ChatHelpers;
  components?: ChatComponents;
  config?: ChatConfig;
  toolRenderers?: Record<string, ToolUIRendererComponent>;
}
