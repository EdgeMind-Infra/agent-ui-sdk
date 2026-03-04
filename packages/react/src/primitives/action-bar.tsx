/**
 * ActionBar Primitive — Message action buttons.
 *
 * Provides:
 * - ActionBar.Root: Container for message actions
 * - ActionBar.Copy: Copy message to clipboard
 * - ActionBar.Edit: Trigger edit mode
 * - ActionBar.Reload: Regenerate response
 * - ActionBar.FeedbackPositive / FeedbackNegative: Feedback buttons
 */

import { isTextUIPart } from "@agent-ui-sdk/core";
import { useAgentUI } from "@agent-ui-sdk/core/react";
import { type HTMLAttributes, type ReactNode, useCallback, useState } from "react";
import { useMessageContext } from "./message";

// ---------------------------------------------------------------------------
// ActionBar.Root
// ---------------------------------------------------------------------------

export interface ActionBarRootProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Only show when hovering the message (controlled externally) */
  hideWhenRunning?: boolean;
}

export function ActionBarRoot({ children, hideWhenRunning = false, ...props }: ActionBarRootProps) {
  const isRunning = useAgentUI((s) => s.isRunning);
  const { message } = useMessageContext();

  if (hideWhenRunning && isRunning) return null;

  return (
    <div
      data-aui="action-bar-root"
      data-role={message.role}
      className="aui-action-bar-root"
      {...props}
    >
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ActionBar.Copy
// ---------------------------------------------------------------------------

export interface ActionBarCopyProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  /** Content shown during 2-second "copied" state */
  copiedChildren?: ReactNode;
  /** Override what gets copied (default: all text parts joined) */
  getText?: () => string;
}

export function ActionBarCopy({ children, copiedChildren, getText, ...props }: ActionBarCopyProps) {
  const { message } = useMessageContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const text =
      getText?.() ??
      message.parts
        .filter(isTextUIPart)
        .map((p) => p.text)
        .join("\n");

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.parts, getText]);

  return (
    <button
      type="button"
      data-aui="action-bar-copy"
      data-copied={copied}
      className="aui-action-bar-copy"
      onClick={handleCopy}
      {...props}
    >
      {copied ? (copiedChildren ?? "Copied") : (children ?? "Copy")}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ActionBar.Edit
// ---------------------------------------------------------------------------

export interface ActionBarEditProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  /** Callback when edit mode is triggered */
  onEdit?: (messageId: string) => void;
}

export function ActionBarEdit({ children, onEdit, ...props }: ActionBarEditProps) {
  const { message } = useMessageContext();

  const handleEdit = useCallback(() => {
    onEdit?.(message.id);
  }, [message.id, onEdit]);

  // Only show edit for user messages
  if (message.role !== "user") return null;

  return (
    <button
      type="button"
      data-aui="action-bar-edit"
      className="aui-action-bar-edit"
      onClick={handleEdit}
      {...props}
    >
      {children ?? "Edit"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ActionBar.Reload
// ---------------------------------------------------------------------------

export interface ActionBarReloadProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}

export function ActionBarReload({ children, ...props }: ActionBarReloadProps) {
  const { message } = useMessageContext();
  const onReload = useAgentUI((s) => s.actions.onReload);

  const handleReload = useCallback(() => {
    onReload?.(message.id);
  }, [message.id, onReload]);

  // Only show reload for assistant messages
  if (message.role !== "assistant") return null;

  return (
    <button
      type="button"
      data-aui="action-bar-reload"
      className="aui-action-bar-reload"
      onClick={handleReload}
      {...props}
    >
      {children ?? "Regenerate"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ActionBar.FeedbackPositive / FeedbackNegative
// ---------------------------------------------------------------------------

export interface ActionBarFeedbackProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}

export function ActionBarFeedbackPositive({ children, ...props }: ActionBarFeedbackProps) {
  const { message } = useMessageContext();
  const onFeedback = useAgentUI((s) => s.actions.onFeedback);

  return (
    <button
      type="button"
      data-aui="action-bar-feedback-positive"
      className="aui-action-bar-feedback-positive"
      onClick={() => onFeedback?.(message.id, "positive")}
      {...props}
    >
      {children ?? "👍"}
    </button>
  );
}

export function ActionBarFeedbackNegative({ children, ...props }: ActionBarFeedbackProps) {
  const { message } = useMessageContext();
  const onFeedback = useAgentUI((s) => s.actions.onFeedback);

  return (
    <button
      type="button"
      data-aui="action-bar-feedback-negative"
      className="aui-action-bar-feedback-negative"
      onClick={() => onFeedback?.(message.id, "negative")}
      {...props}
    >
      {children ?? "👎"}
    </button>
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
