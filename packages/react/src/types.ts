import type { ChatStatus, FileUIPart, UIMessage } from "ai";
import type { ComponentType, HTMLAttributes } from "react";

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

  /** Enable speech input (microphone button). */
  enableSpeechInput?: boolean;
  /** Called when audio is recorded (for browsers without Web Speech API). */
  onAudioRecorded?: (audioBlob: Blob) => Promise<string>;

  /** Enable web search toggle button. */
  enableWebSearch?: boolean;
  /** Whether web search is currently active. */
  webSearchActive?: boolean;
  /** Called when web search is toggled. */
  onWebSearchToggle?: (active: boolean) => void;

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
 * Props for the top-level Chat component.
 */
export interface ChatProps extends HTMLAttributes<HTMLDivElement> {
  chatHelpers: ChatHelpers;
  components?: ChatComponents;
  config?: ChatConfig;
}
