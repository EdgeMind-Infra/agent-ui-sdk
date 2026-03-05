"use client";

import { Confirmation as ConfirmationPrimitive } from "@agent-ui-sdk/react";
import { CheckIcon, XIcon } from "lucide-react";
import type { FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

// ─── Confirmation ─────────────────────────────────────────────────────────

export interface ConfirmationProps {
  toolCallId: string;
  toolName: string;
  /** Description or arguments to show in the request */
  children?: ReactNode;
  /** Custom approve label */
  approveLabel?: ReactNode;
  /** Custom deny label */
  denyLabel?: ReactNode;
  className?: string;
}

export const Confirmation: FC<ConfirmationProps> = ({
  toolCallId,
  toolName,
  children,
  approveLabel,
  denyLabel,
  className,
}) => (
  <ConfirmationPrimitive.Root
    toolCallId={toolCallId}
    toolName={toolName}
    className={cn(
      "rounded-xl border border-[var(--aui-border)] bg-[var(--aui-background)] p-4",
      className,
    )}
  >
    {/* Pending: show request */}
    <ConfirmationPrimitive.Request>
      <div className="mb-3">
        <p className="text-sm font-medium text-[var(--aui-foreground)]">
          Allow tool: <span className="font-mono text-[var(--aui-primary)]">{toolName}</span>
        </p>
        {children && (
          <div className="mt-1 text-xs text-[var(--aui-muted-foreground)]">{children}</div>
        )}
      </div>
      <ConfirmationPrimitive.Actions
        className="flex gap-2"
        approveLabel={
          <span className="inline-flex items-center gap-1.5">
            <CheckIcon className="size-3.5" />
            {approveLabel ?? "Approve"}
          </span>
        }
        denyLabel={
          <span className="inline-flex items-center gap-1.5">
            <XIcon className="size-3.5" />
            {denyLabel ?? "Deny"}
          </span>
        }
      />
    </ConfirmationPrimitive.Request>

    {/* Approved */}
    <ConfirmationPrimitive.Accepted>
      <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckIcon className="size-4" />
        Approved: <span className="font-mono">{toolName}</span>
      </p>
    </ConfirmationPrimitive.Accepted>

    {/* Rejected */}
    <ConfirmationPrimitive.Rejected>
      <p className="flex items-center gap-1.5 text-sm text-[var(--aui-destructive)]">
        <XIcon className="size-4" />
        Denied: <span className="font-mono">{toolName}</span>
      </p>
    </ConfirmationPrimitive.Rejected>
  </ConfirmationPrimitive.Root>
);
