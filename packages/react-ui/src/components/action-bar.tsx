"use client";

import { ActionBar as ActionBarPrimitive } from "@agent-ui-sdk/react";
import {
  CheckIcon,
  CopyIcon,
  PencilIcon,
  RefreshCwIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "lucide-react";
import type { FC } from "react";
import { cn } from "@/lib/utils";

// ─── shared button class ──────────────────────────────────────────────────

const iconBtnCls =
  "inline-flex size-7 items-center justify-center rounded-md text-[var(--aui-muted-foreground)] transition-colors hover:bg-[var(--aui-accent)] hover:text-[var(--aui-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--aui-ring)]";

// ─── ActionBar ────────────────────────────────────────────────────────────

export interface ActionBarProps {
  showEdit?: boolean;
  showReload?: boolean;
  showFeedback?: boolean;
  className?: string;
}

export const ActionBar: FC<ActionBarProps> = ({
  showEdit = false,
  showReload = false,
  showFeedback = false,
  className,
}) => (
  <ActionBarPrimitive.Root
    hideWhenRunning
    className={cn(
      "flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100",
      className,
    )}
  >
    {/* Copy */}
    <ActionBarPrimitive.Copy
      className={iconBtnCls}
      copiedChildren={<CheckIcon className="size-3.5 text-emerald-500" />}
    >
      <CopyIcon className="size-3.5" />
    </ActionBarPrimitive.Copy>

    {/* Edit (auto-hides for non-user messages via primitive) */}
    {showEdit && (
      <ActionBarPrimitive.Edit className={iconBtnCls}>
        <PencilIcon className="size-3.5" />
      </ActionBarPrimitive.Edit>
    )}

    {/* Reload (auto-hides for non-assistant messages via primitive) */}
    {showReload && (
      <ActionBarPrimitive.Reload className={iconBtnCls}>
        <RefreshCwIcon className="size-3.5" />
      </ActionBarPrimitive.Reload>
    )}

    {/* Feedback */}
    {showFeedback && (
      <>
        <ActionBarPrimitive.FeedbackPositive className={iconBtnCls}>
          <ThumbsUpIcon className="size-3.5" />
        </ActionBarPrimitive.FeedbackPositive>
        <ActionBarPrimitive.FeedbackNegative className={iconBtnCls}>
          <ThumbsDownIcon className="size-3.5" />
        </ActionBarPrimitive.FeedbackNegative>
      </>
    )}
  </ActionBarPrimitive.Root>
);
