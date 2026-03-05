"use client";

import type { ReasoningUIPart } from "@agent-ui-sdk/core";
import { Reasoning as ReasoningPrimitive } from "@agent-ui-sdk/react";
import { ChevronDownIcon } from "lucide-react";
import type { FC } from "react";
import { cn } from "@/lib/utils";

// ─── Reasoning ────────────────────────────────────────────────────────────

export interface ReasoningProps {
  part: ReasoningUIPart;
  className?: string;
}

export const Reasoning: FC<ReasoningProps> = ({ part, className }) => (
  <ReasoningPrimitive.Root
    part={part}
    className={cn(
      "group my-1 rounded-lg border border-[var(--aui-border)] bg-[var(--aui-muted)]/50",
      className,
    )}
  >
    {/* Trigger row */}
    <ReasoningPrimitive.Trigger
      streamingLabel={<span className="aui-shimmer font-medium text-xs">Thinking…</span>}
      doneLabel={(s) => (
        <span className="font-medium text-xs text-[var(--aui-muted-foreground)]">
          Thought for {s}s
        </span>
      )}
      className="flex w-full items-center justify-between px-3 py-2 text-left"
    >
      <ChevronDownIcon className="size-3.5 text-[var(--aui-muted-foreground)] transition-transform group-data-[open=true]:rotate-180" />
    </ReasoningPrimitive.Trigger>

    {/* Content */}
    <ReasoningPrimitive.Content className="border-t border-[var(--aui-border)] px-3 py-2 font-mono text-xs leading-relaxed text-[var(--aui-muted-foreground)] whitespace-pre-wrap" />
  </ReasoningPrimitive.Root>
);
