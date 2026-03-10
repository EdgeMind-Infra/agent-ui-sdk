import type { DictationAdapter } from "@agent-ui-sdk/core";
import type { ChatStatus, FileUIPart, UIMessage, UITool, UIToolInvocation } from "ai";
import type { ComponentType, HTMLAttributes, ReactNode } from "react";

/**
 * All user-visible strings in the Chat UI. Override any subset via `config.labels`.
 */
export interface ChatLabels {
  // Message actions
  copy: string;
  copied: string;
  retry: string;
  // Input
  placeholder: string;
  send: string;
  think: string;
  search: string;
  voiceInput: string;
  searchModels: string;
  noModelsFound: string;
  // Reasoning
  thinking: string;
  thoughtForFewSeconds: string;
  thoughtForSeconds: (n: number) => string;
}

export const DEFAULT_CHAT_LABELS: ChatLabels = {
  copy: "Copy",
  copied: "Copied",
  retry: "Retry",
  placeholder: "Type a message...",
  send: "Send",
  think: "Think",
  search: "Search",
  voiceInput: "Voice input",
  searchModels: "Search models...",
  noModelsFound: "No models found.",
  thinking: "Thinking...",
  thoughtForFewSeconds: "Thought for a few seconds",
  thoughtForSeconds: (n) => `Thought for ${n} seconds`,
};

/**
 * Subset of useChat() return value that Chat component needs.
 */
export interface ChatHelpers {
  messages: UIMessage[];
  status: ChatStatus;
  sendMessage: (message: { text: string; files?: FileUIPart[] }) => void;
  stop: () => void;
  error: Error | undefined;
  /** Set messages directly (from useChat). Needed for branch switching. */
  setMessages?: (messages: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => void;
  /** Regenerate assistant response (from useChat). Needed for regeneration. */
  regenerate?: (options?: { messageId?: string }) => Promise<void>;
  /** Respond to a tool approval request (from useChat). */
  addToolApprovalResponse?: (opts: { id: string; approved: boolean; reason?: string }) => void;
}

/**
 * Model configuration for the model selector.
 */
export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  providers?: string[];
  group?: string;
}

/**
 * Configuration for Chat features.
 */
export interface ChatConfig {
  /** Quick suggestion buttons shown above the input. */
  suggestions?: string[];
  /** Called when a suggestion is clicked. Defaults to sendMessage({ text: suggestion }). */
  onSuggestionClick?: (suggestion: string) => void;

  /** Available models for the model selector. */
  models?: ModelConfig[];
  /** Currently selected model ID. */
  selectedModel?: string;
  /** Called when a model is selected. */
  onModelChange?: (modelId: string) => void;

  /** Enable file attachments in the input. */
  enableAttachments?: boolean;

  /** Dictation adapter for speech-to-text. When provided, a microphone button appears next to submit. */
  dictationAdapter?: DictationAdapter;

  /**
   * @deprecated Use `dictationAdapter` instead. Kept for backward compatibility.
   * When provided without `dictationAdapter`, auto-creates a fallback adapter.
   */
  enableSpeechInput?: boolean;
  /**
   * @deprecated Use `dictationAdapter` with `MediaRecorderDictationAdapter` instead.
   * Called when audio is recorded (for browsers without Web Speech API).
   */
  onAudioRecorded?: (audioBlob: Blob) => Promise<string>;

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

  /** Extra ReactNode rendered inside the toolbar (after built-in buttons, before model selector). */
  toolbarExtras?: ReactNode;

  /** Extra ReactNode rendered to the left of the submit button. */
  toolbarRight?: ReactNode;

  /** Get all branch versions for a message (including itself). Provided by useBranchedChat. */
  getBranches?: (messageId: string) => UIMessage[];
  /** Switch to a specific branch by message ID. Provided by useBranchedChat. */
  onSwitchBranch?: (messageId: string) => void;

  /** Restore checkpoint: truncates conversation to after a given message ID. */
  onRestoreCheckpoint?: (messageId: string) => void;
  /** Regenerate the assistant response (creates a new branch). */
  onRegenerate?: (messageId: string) => void;
  /** Copy message text to clipboard. Uses navigator.clipboard by default. */
  onCopy?: (messageId: string, text: string) => void;

  /** Override any subset of UI strings. Falls back to English defaults. */
  labels?: Partial<ChatLabels>;
}

/**
 * Props for the ChatMessage component.
 */
export interface ChatMessageProps {
  message: UIMessage;
  isLastMessage: boolean;
  isStreaming: boolean;
  /** All branch versions of this message (including itself). */
  branches?: UIMessage[];
  /** Callback to switch to a specific branch by message ID. */
  onSwitchBranch?: (messageId: string) => void;
}

/**
 * Props for the ChatInput component.
 */
export interface ChatInputProps {
  className?: string;
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
    state: ToolCallState;
    input?: unknown;
    output?: unknown;
    errorText?: string;
    title?: string;
    approval?: ToolApprovalData;
  };
  messageId: string;
  partIndex: number;
  addToolApprovalResponse?: (opts: { id: string; approved: boolean; reason?: string }) => void;
}

export interface SourcePartProps {
  sources: Array<{
    sourceId: string;
    url: string;
    title?: string;
  }>;
}

/**
 * Tool call state values, derived from AI SDK's UIToolInvocation.
 */
export type ToolCallState = UIToolInvocation<UITool>["state"];

/**
 * Props passed to a per-tool custom renderer registered via useToolUI / makeToolUI / toolRenderers.
 * Aligned with AI SDK's ToolUIPart / DynamicToolUIPart fields.
 */
export interface ToolApprovalData {
  id: string;
  approved?: boolean;
  reason?: string;
}

export interface ToolUIProps<TArgs = unknown, TResult = unknown> {
  toolName: string;
  toolCallId: string;
  state: ToolCallState;
  input?: TArgs;
  output?: TResult;
  errorText?: string;
  title?: string;
  messageId: string;
  partIndex: number;
  approval?: ToolApprovalData;
  addToolApprovalResponse?: (opts: { id: string; approved: boolean; reason?: string }) => void;
}

/**
 * A React component that renders a custom tool UI.
 */
export type ToolUIRendererComponent<TArgs = unknown, TResult = unknown> = ComponentType<
  ToolUIProps<TArgs, TResult>
>;

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
 * Props for the top-level Chat component.
 */
export interface ChatProps extends HTMLAttributes<HTMLDivElement> {
  chatHelpers: ChatHelpers;
  components?: ChatComponents;
  config?: ChatConfig;
  /** Per-tool custom renderers. Keys are toolName strings. Takes priority over useToolUI registry. */
  toolRenderers?: Record<string, ToolUIRendererComponent>;
}
