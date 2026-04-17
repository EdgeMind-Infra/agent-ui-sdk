// @agent-ui-sdk/react-native
// Ready-to-use AI chat UI components for React Native

// Main component
export { Chat } from "./chat/chat";

// Sub-components (for custom composition)
export { ChatInput } from "./chat/chat-input";
export { ChatMessage } from "./chat/chat-message";
export { ChatMessages } from "./chat/chat-messages";
export type { ChatContextValue, ChatProviderProps } from "./chat/chat-provider";
export { ChatProvider, useChatContext } from "./chat/chat-provider";
export { ReasoningPart } from "./chat/parts/reasoning-part";
export { SourcePart } from "./chat/parts/source-part";
// Part renderers
export { TextPart } from "./chat/parts/text-part";
export { ToolPart } from "./chat/parts/tool-part";
export type {
  ConversationEmptyStateProps,
  ConversationProps,
  ConversationScrollButtonProps,
} from "./components/conversation";
// Conversation components
export {
  Conversation,
  ConversationEmptyState,
  ConversationScrollButton,
} from "./components/conversation";
export type { ShimmerProps } from "./components/shimmer";
export { Shimmer } from "./components/shimmer";
export type { UseBranchedChatOptions, UseBranchedChatReturn } from "./hooks/use-branched-chat";
// Hooks
export { useBranchedChat } from "./hooks/use-branched-chat";
export type { UseToolUIOptions } from "./hooks/use-tool-ui";
export { useToolUI } from "./hooks/use-tool-ui";
// Theme
export type { ColorTokens } from "./theme/colors";
export { darkColors, lightColors } from "./theme/colors";
export type { ThemeMode, ThemeProviderProps } from "./theme/theme-provider";
export { ThemeProvider, useTheme } from "./theme/theme-provider";
// Thread list
export {
  ThreadListChatProvider,
  type ThreadListChatProviderProps,
} from "./thread-list/thread-list-chat-provider";
export {
  type ThreadListActions,
  type ThreadListContextValue,
  ThreadListProvider,
  type ThreadListProviderProps,
  type ThreadListState,
  useThreadList,
} from "./thread-list/thread-list-provider";

// Types
export type {
  ChatComponents,
  ChatConfig,
  ChatHelpers,
  ChatInputProps,
  ChatMessageProps,
  ChatMessagesProps,
  ChatProps,
  ReasoningPartProps,
  SourcePartProps,
  TextPartProps,
  ToolPartProps,
  ToolUIProps,
  ToolUIRendererComponent,
} from "./types";

// UI components (re-exported for custom composition)
export { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
export type { ButtonProps } from "./ui/button";
export { Button } from "./ui/button";
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
export { Separator } from "./ui/separator";
export { Skeleton } from "./ui/skeleton";
export { Text, TextClassContext } from "./ui/text";
export { Textarea } from "./ui/textarea";
