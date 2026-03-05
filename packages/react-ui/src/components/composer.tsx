"use client";

import { Composer as ComposerPrimitive } from "@agent-ui-sdk/react";
import { ArrowUpIcon, SquareIcon } from "lucide-react";
import type { FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── ComposerSendButton ───────────────────────────────────────────────────

const ComposerSendButton: FC = () => (
  <ComposerPrimitive.Send
    stopChildren={
      <span className="flex size-8 items-center justify-center rounded-full bg-[var(--aui-primary)] hover:opacity-90 disabled:opacity-50">
        <SquareIcon className="size-3.5 fill-current text-[var(--aui-primary-foreground)]" />
      </span>
    }
    className="flex size-8 items-center justify-center rounded-full bg-[var(--aui-primary)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
  >
    <ArrowUpIcon className="size-4 text-[var(--aui-primary-foreground)]" />
  </ComposerPrimitive.Send>
);

// ─── Composer ─────────────────────────────────────────────────────────────

export interface ComposerProps {
  placeholder?: string;
  className?: string;
  /** Slot for file attachment button or other leading elements */
  leading?: ReactNode;
}

export const Composer: FC<ComposerProps> = ({
  placeholder = "Send a message…",
  className,
  leading,
}) => (
  <ComposerPrimitive.Root
    className={cn(
      "relative flex w-full flex-col rounded-2xl border border-[var(--aui-border)] bg-[var(--aui-background)] shadow-sm transition-shadow focus-within:ring-2 focus-within:ring-[var(--aui-ring)]",
      className,
    )}
  >
    {/* Leading slot (e.g., attachment button) */}
    {leading && (
      <div className="flex items-center gap-1 border-b border-[var(--aui-border)] px-3 py-1">
        {leading}
      </div>
    )}

    <div className="flex items-end gap-2 px-3 py-2.5">
      <ComposerPrimitive.Input
        placeholder={placeholder}
        className="flex-1 resize-none bg-transparent text-sm text-[var(--aui-foreground)] placeholder:text-[var(--aui-muted-foreground)] outline-none disabled:cursor-not-allowed"
        rows={1}
        style={{ maxHeight: "200px", overflowY: "auto" }}
      />
      <ComposerSendButton />
    </div>
  </ComposerPrimitive.Root>
);
