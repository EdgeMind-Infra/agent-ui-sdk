// ─── Styled Components ────────────────────────────────────────────────────

export type { ActionBarProps } from "./components/ActionBar";
export { ActionBar } from "./components/ActionBar";
export type { CodeBlockProps } from "./components/CodeBlock";
export { CodeBlock } from "./components/CodeBlock";
export type { ComposerProps } from "./components/Composer";
export { Composer } from "./components/Composer";
export type {
  AssistantMessageProps,
  TextPartProps,
  UserMessageProps,
} from "./components/Message";
export {
  AssistantMessage,
  TextPart,
  UserMessage,
} from "./components/Message";
export type { EmptyStateProps, ThreadProps } from "./components/Thread";
export { EmptyState, Thread } from "./components/Thread";
export type { ThemeProviderProps } from "./theme/ThemeProvider";
// ─── Theme ────────────────────────────────────────────────────────────────
export { ThemeProvider } from "./theme/ThemeProvider";
export type { ColorTokens, ThemeTokens } from "./theme/tokens";

export { darkTheme, lightTheme } from "./theme/tokens";
export { useTheme } from "./theme/useTheme";
