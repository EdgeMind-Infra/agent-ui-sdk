// ─── Styled Components ────────────────────────────────────────────────────

export type { ActionBarProps } from "./components/action-bar";
export { ActionBar } from "./components/action-bar";
export type { BranchPickerProps } from "./components/branch-picker";
export { BranchPicker } from "./components/branch-picker";
export type { CodeBlockProps } from "./components/code-block";
export { CodeBlock } from "./components/code-block";
export type { ComposerProps } from "./components/composer";
export { Composer } from "./components/composer";
export type { ConfirmationProps } from "./components/confirmation";
export { Confirmation } from "./components/confirmation";
export type {
  AssistantMessagePartComponents,
  AssistantMessageProps,
  EditComposerProps,
  TextPartProps,
  UserMessageProps,
} from "./components/message";
export {
  AssistantMessage,
  EditComposer,
  TextPart,
  UserMessage,
} from "./components/message";
export type { ReasoningProps } from "./components/reasoning";
export { Reasoning } from "./components/reasoning";
export type { ThreadProps, ThreadWelcomeProps } from "./components/thread";
export { Thread, ThreadScrollToBottom, ThreadWelcome } from "./components/thread";
export type { BadgeProps } from "./components/ui/badge";
export { Badge, badgeVariants } from "./components/ui/badge";
export type { ButtonProps } from "./components/ui/button";
// ─── shadcn/ui Base Components ────────────────────────────────────────────
export { Button, buttonVariants } from "./components/ui/button";

export {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./components/ui/tooltip";

// ─── Utility ─────────────────────────────────────────────────────────────
export { cn } from "./lib/utils";
