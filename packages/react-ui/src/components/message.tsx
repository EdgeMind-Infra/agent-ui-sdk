"use client";

import type { AnyUIMessage, AnyUIMessagePart } from "@agent-ui-sdk/core";
import { Composer, Message as MessagePrimitive, useComposerContext } from "@agent-ui-sdk/react";
import type { ComponentType, FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── TextPart (default text renderer) ────────────────────────────────────

export interface TextPartProps {
  part: AnyUIMessagePart;
}

export const TextPart: FC<TextPartProps> = ({ part }) => {
  if (part.type !== "text") return null;
  return (
    <span className="whitespace-pre-wrap leading-relaxed text-[var(--aui-foreground)]">
      {part.text}
    </span>
  );
};

// ─── UserMessage ──────────────────────────────────────────────────────────

export interface UserMessageProps {
  message: AnyUIMessage;
  index: number;
  /** Custom part renderers */
  components?: {
    Text?: ComponentType<TextPartProps>;
  };
  className?: string;
}

export const UserMessage: FC<UserMessageProps> = ({ message, index, components, className }) => {
  const TextComponent = components?.Text ?? TextPart;

  return (
    <MessagePrimitive.Root
      message={message}
      index={index}
      className={cn("flex w-full justify-end px-4 py-1", className)}
    >
      <div className="max-w-[80%] rounded-2xl bg-[var(--aui-primary)] px-4 py-2.5 text-sm text-[var(--aui-primary-foreground)]">
        <MessagePrimitive.Parts
          components={{
            Text: TextComponent as ComponentType<{ part: AnyUIMessagePart; index: number }>,
          }}
        />
      </div>
    </MessagePrimitive.Root>
  );
};

// ─── AssistantMessage ─────────────────────────────────────────────────────

export interface AssistantMessagePartComponents {
  Text?: ComponentType<TextPartProps>;
  Reasoning?: ComponentType<{ part: AnyUIMessagePart; index: number }>;
  ToolCall?: ComponentType<{ part: AnyUIMessagePart; index: number }>;
  Fallback?: ComponentType<{ part: AnyUIMessagePart; index: number }>;
}

export interface AssistantMessageProps {
  message: AnyUIMessage;
  index: number;
  /** Whether this is the last message (shows streaming cursor) */
  isLast?: boolean;
  /** Custom part renderers */
  components?: AssistantMessagePartComponents;
  /** Action buttons (copy, regenerate etc.) — rendered below content, inside MessageRoot */
  actions?: ReactNode;
  /**
   * Footer rendered inside MessageRoot after actions.
   * Use this for components that need MessageContext, e.g. <BranchPicker />.
   */
  footer?: ReactNode;
  className?: string;
}

export const AssistantMessage: FC<AssistantMessageProps> = ({
  message,
  index,
  isLast = false,
  components,
  actions,
  footer,
  className,
}) => {
  const TextComponent = components?.Text ?? TextPart;

  return (
    <MessagePrimitive.Root
      message={message}
      index={index}
      isLast={isLast}
      className={cn("flex w-full flex-col px-4 py-1", className)}
    >
      <div className="max-w-[90%] text-sm text-[var(--aui-foreground)]">
        <MessagePrimitive.Parts
          components={{
            Text: TextComponent as ComponentType<{ part: AnyUIMessagePart; index: number }>,
            Reasoning: components?.Reasoning,
            ToolCall: components?.ToolCall as any,
            Fallback: components?.Fallback,
          }}
        />
      </div>
      {actions && (
        <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {actions}
        </div>
      )}
      {footer}
    </MessagePrimitive.Root>
  );
};

// ─── EditComposer ─────────────────────────────────────────────────────────

export interface EditComposerProps {
  message: AnyUIMessage;
  index: number;
  onCancel?: () => void;
  className?: string;
}

const EditComposerInner: FC<{ onCancel?: () => void; className?: string }> = ({
  onCancel,
  className,
}) => {
  useComposerContext();

  return (
    <div className={cn("flex w-full flex-col gap-2 px-4 py-1", className)}>
      <Composer.Input className="min-h-[80px] w-full resize-none rounded-xl border border-[var(--aui-border)] bg-[var(--aui-background)] p-3 text-sm text-[var(--aui-foreground)] outline-none focus:ring-2 focus:ring-[var(--aui-ring)]" />
      <div className="flex justify-end gap-2">
        <Composer.Cancel
          className="rounded-lg border border-[var(--aui-border)] px-3 py-1.5 text-sm hover:bg-[var(--aui-accent)]"
          onClick={onCancel}
        >
          Cancel
        </Composer.Cancel>
        <Composer.Send className="rounded-lg bg-[var(--aui-primary)] px-3 py-1.5 text-sm text-[var(--aui-primary-foreground)] hover:opacity-90">
          Save
        </Composer.Send>
      </div>
    </div>
  );
};

export const EditComposer: FC<EditComposerProps> = ({ message, index, onCancel, className }) => {
  const textContent = message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { type: "text"; text: string }).text)
    .join("");

  return (
    <MessagePrimitive.Root message={message} index={index} className={cn("w-full", className)}>
      <Composer.Root initialText={textContent} editMessageId={message.id} onCancelEdit={onCancel}>
        <EditComposerInner onCancel={onCancel} />
      </Composer.Root>
    </MessagePrimitive.Root>
  );
};
