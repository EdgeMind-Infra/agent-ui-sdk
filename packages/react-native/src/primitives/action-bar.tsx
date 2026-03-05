/**
 * ActionBar Primitive (React Native) — Message action buttons.
 *
 * - ActionBar.Root: Container for message actions
 * - ActionBar.Copy: Copy message to clipboard
 * - ActionBar.Edit: Trigger edit mode (user messages only)
 * - ActionBar.Reload: Regenerate response (assistant messages only)
 * - ActionBar.FeedbackPositive / FeedbackNegative: Feedback buttons
 */

import { isTextUIPart } from "@agent-ui-sdk/core";
import { useAgentUI } from "@agent-ui-sdk/core/react";
import { type ReactNode, useCallback, useState } from "react";
import { Pressable, type StyleProp, Text, View, type ViewStyle } from "react-native";
import { useMessageContext } from "./message";

// ---------------------------------------------------------------------------
// ActionBar.Root
// ---------------------------------------------------------------------------

export interface ActionBarRootProps {
  children: ReactNode;
  hideWhenRunning?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ActionBarRoot({ children, hideWhenRunning = false, style }: ActionBarRootProps) {
  const isRunning = useAgentUI((s) => s.isRunning);

  if (hideWhenRunning && isRunning) return null;

  return (
    <View style={style} testID="aui-action-bar-root">
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ActionBar.Copy
// ---------------------------------------------------------------------------

export interface ActionBarCopyProps {
  children?: ReactNode;
  copiedChildren?: ReactNode;
  /** Override what gets copied (default: all text parts joined) */
  getText?: () => string;
  /** Called with the text to copy. Consumer handles clipboard. */
  onCopy: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function ActionBarCopy({
  children,
  copiedChildren,
  getText,
  onCopy,
  style,
}: ActionBarCopyProps) {
  const { message } = useMessageContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text =
      getText?.() ??
      message.parts
        .filter(isTextUIPart)
        .map((p) => p.text)
        .join("\n");

    onCopy(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.parts, getText, onCopy]);

  return (
    <Pressable
      onPress={handleCopy}
      style={style}
      testID="aui-action-bar-copy"
      accessibilityRole="button"
      accessibilityLabel={copied ? "Copied" : "Copy message"}
    >
      {copied ? (copiedChildren ?? <Text>Copied</Text>) : (children ?? <Text>Copy</Text>)}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// ActionBar.Edit
// ---------------------------------------------------------------------------

export interface ActionBarEditProps {
  children?: ReactNode;
  onEdit?: (messageId: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function ActionBarEdit({ children, onEdit, style }: ActionBarEditProps) {
  const { message } = useMessageContext();

  const handleEdit = useCallback(() => {
    onEdit?.(message.id);
  }, [message.id, onEdit]);

  if (message.role !== "user") return null;

  return (
    <Pressable
      onPress={handleEdit}
      style={style}
      testID="aui-action-bar-edit"
      accessibilityRole="button"
      accessibilityLabel="Edit message"
    >
      {children ?? <Text>Edit</Text>}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// ActionBar.Reload
// ---------------------------------------------------------------------------

export interface ActionBarReloadProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ActionBarReload({ children, style }: ActionBarReloadProps) {
  const { message } = useMessageContext();
  const onRegenerate = useAgentUI((s) => s.actions.onRegenerate);

  const handleReload = useCallback(() => {
    onRegenerate?.();
  }, [onRegenerate]);

  if (message.role !== "assistant") return null;

  return (
    <Pressable
      onPress={handleReload}
      style={style}
      testID="aui-action-bar-reload"
      accessibilityRole="button"
      accessibilityLabel="Regenerate"
    >
      {children ?? <Text>Regenerate</Text>}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// ActionBar.FeedbackPositive / FeedbackNegative
// ---------------------------------------------------------------------------

export interface ActionBarFeedbackProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ActionBarFeedbackPositive({ children, style }: ActionBarFeedbackProps) {
  const { message } = useMessageContext();
  const onFeedback = useAgentUI((s) => s.actions.onFeedback);

  return (
    <Pressable
      onPress={() => onFeedback?.(message.id, "positive")}
      style={style}
      testID="aui-action-bar-feedback-positive"
      accessibilityRole="button"
      accessibilityLabel="Positive feedback"
    >
      {children ?? <Text>+</Text>}
    </Pressable>
  );
}

export function ActionBarFeedbackNegative({ children, style }: ActionBarFeedbackProps) {
  const { message } = useMessageContext();
  const onFeedback = useAgentUI((s) => s.actions.onFeedback);

  return (
    <Pressable
      onPress={() => onFeedback?.(message.id, "negative")}
      style={style}
      testID="aui-action-bar-feedback-negative"
      accessibilityRole="button"
      accessibilityLabel="Negative feedback"
    >
      {children ?? <Text>-</Text>}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const ActionBar = {
  Root: ActionBarRoot,
  Copy: ActionBarCopy,
  Edit: ActionBarEdit,
  Reload: ActionBarReload,
  FeedbackPositive: ActionBarFeedbackPositive,
  FeedbackNegative: ActionBarFeedbackNegative,
};
