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
export type {
  ConversationContentProps,
  ConversationProps,
  ConversationScrollButtonProps,
} from "./components/ai-elements/conversation";
export {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "./components/ai-elements/conversation";
// Dictation components
export type { DictationButtonProps } from "./components/ai-elements/dictation-button";
export { DictationButton } from "./components/ai-elements/dictation-button";
export type { DictationTranscriptProps } from "./components/ai-elements/dictation-transcript";
export { DictationTranscript } from "./components/ai-elements/dictation-transcript";
export type { MessageResponseProps } from "./components/ai-elements/message";
// Message response (Streamdown wrapper with default plugins)
export { MessageResponse } from "./components/ai-elements/message";
// Prompt input primitives (for toolbar extension)
export { PromptInputButton } from "./components/ai-elements/prompt-input";
// Rich prompt input (TipTap-based, optional peer deps)
export { RichPromptInput } from "./components/ai-elements/rich-prompt-input";
// AI element primitives
export type { TextShimmerProps } from "./components/ai-elements/shimmer";
export { Shimmer } from "./components/ai-elements/shimmer";
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
  CommandData,
  CommandNodeRenderProps,
  MentionData,
  ModelConfig,
  ReasoningPartProps,
  RichPromptInputHandle,
  RichPromptInputProps,
  RichPromptInputSubmitPayload,
  SourcePartProps,
  SuggestionRenderProps,
  TextPartProps,
  ToolApprovalData,
  ToolCallState,
  ToolPartProps,
  ToolUIProps,
  ToolUIRendererComponent,
  TriggerConfig,
} from "./types";
export { DEFAULT_CHAT_LABELS } from "./types";
