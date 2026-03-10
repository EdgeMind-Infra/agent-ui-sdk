// @agent-ui-sdk/react
// Ready-to-use AI chat UI components for React Web

// Main component
export { Chat } from "./chat/chat";
export { ChatInput } from "./chat/chat-input";
export { ChatMessage } from "./chat/chat-message";
export { ChatMessages } from "./chat/chat-messages";
// Re-export ChatProvider types
export type { ChatContextValue, ChatProviderProps } from "./chat/chat-provider";
// Sub-components (for custom composition)
export { ChatProvider, useChatContext } from "./chat/chat-provider";
export { ReasoningPart } from "./chat/parts/reasoning-part";
export { SourcePart } from "./chat/parts/source-part";
// Part renderers (for custom composition or replacement)
export { TextPart } from "./chat/parts/text-part";
export { ToolPart } from "./chat/parts/tool-part";
// Dictation components
export type { DictationButtonProps } from "./components/ai-elements/dictation-button";
export { DictationButton } from "./components/ai-elements/dictation-button";
export type { DictationTranscriptProps } from "./components/ai-elements/dictation-transcript";
export { DictationTranscript } from "./components/ai-elements/dictation-transcript";
// Prompt input primitives (for toolbar extension)
export { PromptInputButton } from "./components/ai-elements/prompt-input";
export type { UseBranchedChatOptions, UseBranchedChatReturn } from "./hooks/use-branched-chat";
export { useBranchedChat } from "./hooks/use-branched-chat";
// Hooks
export type {
  DictationStatus,
  UseDictationOptions,
  UseDictationReturn,
} from "./hooks/use-dictation";
export { useDictation } from "./hooks/use-dictation";
export type { UseToolUIOptions } from "./hooks/use-tool-ui";
export { useToolUI } from "./hooks/use-tool-ui";
export type { ToolUIComponent } from "./model-context/make-tool-ui";
// Tool UI factory
export { makeToolUI } from "./model-context/make-tool-ui";
// Types
// Thread list
export type {
  ThreadListActions,
  ThreadListChatProviderProps,
  ThreadListContextValue,
  ThreadListProviderProps,
  ThreadListSidebarProps,
  ThreadListState,
} from "./thread-list";
export {
  ThreadListChatProvider,
  ThreadListProvider,
  ThreadListSidebar,
  useThreadList,
} from "./thread-list";
export type {
  ChatComponents,
  ChatConfig,
  ChatHelpers,
  ChatInputProps,
  ChatLabels,
  ChatMessageProps,
  ChatMessagesProps,
  ChatProps,
  ModelConfig,
  ReasoningPartProps,
  SourcePartProps,
  TextPartProps,
  ToolApprovalData,
  ToolCallState,
  ToolPartProps,
  ToolUIProps,
  ToolUIRendererComponent,
} from "./types";
export { DEFAULT_CHAT_LABELS } from "./types";
