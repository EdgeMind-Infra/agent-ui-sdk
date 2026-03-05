"use client";

import { BranchPicker as BranchPickerPrimitive } from "@agent-ui-sdk/react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { FC } from "react";
import { cn } from "@/lib/utils";

// ─── BranchPicker ─────────────────────────────────────────────────────────

export interface BranchPickerProps {
  className?: string;
}

export const BranchPicker: FC<BranchPickerProps> = ({ className }) => (
  <BranchPickerPrimitive.Root
    className={cn("flex items-center gap-1 text-xs text-[var(--aui-muted-foreground)]", className)}
  >
    <BranchPickerPrimitive.Previous className="inline-flex size-5 items-center justify-center rounded hover:bg-[var(--aui-accent)] hover:text-[var(--aui-foreground)] transition-colors disabled:opacity-50">
      <ChevronLeftIcon className="size-3" />
    </BranchPickerPrimitive.Previous>

    <span className="tabular-nums">
      <BranchPickerPrimitive.Number />
      {" / "}
      <BranchPickerPrimitive.Count />
    </span>

    <BranchPickerPrimitive.Next className="inline-flex size-5 items-center justify-center rounded hover:bg-[var(--aui-accent)] hover:text-[var(--aui-foreground)] transition-colors disabled:opacity-50">
      <ChevronRightIcon className="size-3" />
    </BranchPickerPrimitive.Next>
  </BranchPickerPrimitive.Root>
);
