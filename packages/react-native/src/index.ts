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
export type { ColorTokens } from "./theme/colors";
export { darkColors, lightColors } from "./theme/colors";
export type { ThemeMode, ThemeProviderProps } from "./theme/theme-provider";
// Theme
export { ThemeProvider, useTheme } from "./theme/theme-provider";
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
} from "./types";
export { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
export type { ButtonProps } from "./ui/button";
// UI components (re-exported for custom composition)
export { Button } from "./ui/button";
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
export { Separator } from "./ui/separator";
export { Skeleton } from "./ui/skeleton";
export { Text, TextClassContext } from "./ui/text";
export { Textarea } from "./ui/textarea";
