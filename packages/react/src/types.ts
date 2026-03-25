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
  stop: string;
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
  stop: "Stop",
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
 *
 * @typeParam UI_MESSAGE - The UIMessage subtype carrying typed data parts.
 *   Defaults to the base `UIMessage` for backwards compatibility.
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
  /** Respond to a tool approval request (from useChat). */
  addToolApprovalResponse?: (opts: {
    id: string;
    approved: boolean;
    reason?: string;
    extra?: Record<string, unknown>;
  }) => void;
  /** Write tool output to a tool part (from useChat). */
  addToolOutput?: (opts: {
    tool: string;
    toolCallId: string;
    output: unknown;
    state?: "output-available";
  }) => Promise<void>;
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

/** Helpers exposed by ChatInput to toolbar extensions. */
export interface InputHelpers {
  /** Insert a command/skill tag (chip) into the input editor. */
  insertCommandTag: (attrs: { id: string; label: string; refType?: string }) => void;
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

  /** Trigger configs for RichPromptInput (TipTap). When provided, the textarea is replaced with a TipTap editor supporting / commands and @ mentions. */
  triggers?: TriggerConfig<any>[];

  /** Extra ReactNode rendered inside the input group, above the textarea (e.g. pending file cards). */
  headerContent?: ReactNode;

  /** Extra ReactNode rendered inside the toolbar (after built-in buttons, before model selector).
   *  Can be a ReactNode or a render function receiving input helpers. */
  toolbarExtras?: ReactNode | ((helpers: InputHelpers) => ReactNode);

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

  /** Hook: triggered after a tool approval response, for syncing with backend confirm API. */
  onToolApprovalResponse?: (opts: {
    id: string;
    approved: boolean;
    reason?: string;
    extra?: Record<string, unknown>;
  }) => void;

  /** Hook: triggered when the user clicks the stop button, for notifying backend to abort. */
  onStop?: () => void;
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
  ref?: import("react").Ref<ChatInputHandle>;
}

/**
 * Imperative handle exposed by ChatInput via ref.
 */
export interface ChatInputHandle {
  /** Insert text into the rich editor at cursor position. */
  insertText: (text: string) => void;
  /** Clear the editor and set new text content. */
  setContent: (text: string) => void;
  /** Focus the rich editor. */
  focus: () => void;
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
  addToolApprovalResponse?: (opts: {
    id: string;
    approved: boolean;
    reason?: string;
    extra?: Record<string, unknown>;
  }) => void;
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
  addToolApprovalResponse?: (opts: {
    id: string;
    approved: boolean;
    reason?: string;
    extra?: Record<string, unknown>;
  }) => void;
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
export interface ChatProps<UI_MESSAGE extends UIMessage = UIMessage>
  extends HTMLAttributes<HTMLDivElement> {
  chatHelpers: ChatHelpers<UI_MESSAGE>;
  components?: ChatComponents;
  config?: ChatConfig;
  /** Per-tool custom renderers. Keys are toolName strings. Takes priority over useToolUI registry. */
  toolRenderers?: Record<string, ToolUIRendererComponent>;
}

// ============================================================================
// RichPromptInput types
// ============================================================================

/**
 * Props passed to the caller's suggestion popup render function.
 */
export interface SuggestionRenderProps<TItem = unknown> {
  /** Filtered items returned by the trigger's `items` callback. */
  items: TItem[];
  /** Current query string typed after the trigger character. */
  query: string;
  /** Call this with a selected item to execute the selection. */
  command: (item: TItem) => void;
  /** Returns the DOMRect of the trigger text for popup positioning. */
  clientRect: (() => DOMRect | null) | null;
  /** Index of the currently keyboard-selected item. Use this to highlight the active item. */
  selectedIndex: number;
}

/**
 * Configuration for a single trigger (e.g., "/" or "@").
 */
/**
 * Props passed to a custom command node renderer.
 */
export interface CommandNodeRenderProps {
  id: string;
  label: string;
  onDelete: () => void;
}

export interface TriggerConfig<TItem = unknown> {
  /** Trigger character, e.g., "/" or "@". */
  char: string;
  items: (query: string) => TItem[] | Promise<TItem[]>;
  render: (props: SuggestionRenderProps<TItem>) => ReactNode;
  onSelect?: (item: TItem) => void;
  type?: "mention" | "command";
  /** Default refType for items that don't provide their own (e.g., "file", "skill", "command"). */
  refType?: string;
  /** When true, command-type triggers insert an inline node instead of just calling onSelect. */
  insertAsTag?: boolean;
  /** Custom renderer for the inline command node. If omitted, renders plain text "/{label}". Only used when insertAsTag is true. */
  renderNode?: (props: CommandNodeRenderProps) => ReactNode;
}

export interface MentionData {
  id: string;
  label: string;
  refType?: string;
}

export interface CommandData {
  id: string;
  label: string;
  refType?: string;
}

export interface RichPromptInputSubmitPayload {
  /** 序列化为扩展 Markdown 的完整文本（包含 @[label]{type:id} / /[label]{type:id} 标记） */
  text: string;
  mentions: MentionData[];
  commands: CommandData[];
}

/** Imperative handle exposed by RichPromptInput via ref */
export interface RichPromptInputHandle {
  /** Insert text at the current cursor position (or end if not focused) */
  insertText: (text: string) => void;
  /** Insert a command/skill tag (chip) at the current cursor position */
  insertCommandTag: (attrs: { id: string; label: string; refType?: string }) => void;
  /** Clear the editor and set new text content */
  setContent: (text: string) => void;
  /** Focus the editor */
  focus: () => void;
  /** Check if the editor is empty */
  isEmpty: () => boolean;
  /** Trigger submit programmatically (serializes content and calls onSubmit) */
  submit: () => void;
}

export interface RichPromptInputProps {
  triggers?: TriggerConfig<any>[];
  placeholder?: string;
  onSubmit?: (payload: RichPromptInputSubmitPayload) => void;
  chatHelpers?: ChatHelpers;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** When true, renders only the TipTap editor without wrapper border and submit button. Used when embedded inside ChatInput. */
  embedded?: boolean;
  /** Called when the editor empty state changes. Used by ChatInput to disable submit button. */
  onEmptyChange?: (isEmpty: boolean) => void;
}
