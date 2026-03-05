"use client";

import type { AnyUIMessage } from "@agent-ui-sdk/core";
import { Thread as ThreadPrimitive } from "@agent-ui-sdk/react";
import { ArrowDownIcon } from "lucide-react";
import type { ComponentType, FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── ThreadScrollToBottom ─────────────────────────────────────────────────

export const ThreadScrollToBottom: FC<{ className?: string }> = ({ className }) => (
  <ThreadPrimitive.ScrollToBottom>
    <button
      type="button"
      className={cn(
        "absolute -top-12 left-1/2 z-10 -translate-x-1/2 flex size-8 items-center justify-center rounded-full border border-[var(--aui-border)] bg-[var(--aui-background)] shadow-md transition-opacity hover:bg-[var(--aui-accent)]",
        className,
      )}
    >
      <ArrowDownIcon className="size-4 text-[var(--aui-muted-foreground)]" />
    </button>
  </ThreadPrimitive.ScrollToBottom>
);

// ─── ThreadWelcome ────────────────────────────────────────────────────────

export interface ThreadWelcomeProps {
  title?: string;
  subtitle?: string;
}

export const ThreadWelcome: FC<ThreadWelcomeProps> = ({
  title = "Hello there!",
  subtitle = "How can I help you today?",
}) => (
  <div className="mx-auto my-auto flex w-full max-w-[44rem] grow flex-col items-center justify-center px-4 py-16">
    <h1 className="text-2xl font-semibold text-[var(--aui-foreground)]">{title}</h1>
    <p className="mt-1 text-[var(--aui-muted-foreground)]">{subtitle}</p>
  </div>
);

// ─── Thread (compound) ────────────────────────────────────────────────────

export interface ThreadProps {
  /** Component to render each message */
  components: {
    Message: ComponentType<{ message: AnyUIMessage; index: number }>;
  };
  /** Override messages */
  messages?: AnyUIMessage[];
  /** Custom welcome screen */
  welcome?: ReactNode;
  /** Whether an initial fetch is in progress */
  isLoading?: boolean;
  /** Load older messages when scrolled to top */
  onLoadMore?: () => Promise<void> | void;
  className?: string;
}

export const Thread: FC<ThreadProps> = ({
  components,
  messages,
  welcome,
  isLoading,
  onLoadMore,
  className,
}) => (
  <ThreadPrimitive.Root
    messages={messages}
    isLoading={isLoading}
    onLoadMore={onLoadMore}
    className={cn("relative flex h-full flex-col bg-[var(--aui-background)]", className)}
  >
    <ThreadPrimitive.Messages
      components={{
        Message: ({ message, index }) => <components.Message message={message} index={index} />,
      }}
    />

    <ThreadPrimitive.Empty>{welcome ?? <ThreadWelcome />}</ThreadPrimitive.Empty>

    {/* Sticky footer with scroll button */}
    <div className="sticky bottom-0 flex justify-center pb-2">
      <ThreadScrollToBottom />
    </div>
  </ThreadPrimitive.Root>
);
