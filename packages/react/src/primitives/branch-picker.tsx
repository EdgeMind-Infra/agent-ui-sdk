/**
 * BranchPicker Primitive — Navigate between message branches.
 *
 * Provides:
 * - BranchPicker.Root: Container (auto-hides when only 1 branch)
 * - BranchPicker.Previous / Next: Navigation buttons (wrap-around)
 * - BranchPicker.Count / Number: Branch count and current index
 */

import { useAgentUI } from "@agent-ui-sdk/core/react";
import { type HTMLAttributes, type ReactNode, useCallback } from "react";
import { useMessageContext } from "./message";

// ---------------------------------------------------------------------------
// useBranch hook (internal)
// ---------------------------------------------------------------------------

function useBranch() {
  const { message } = useMessageContext();
  const repository = useAgentUI((s) => s.repository);
  const refreshMessages = useAgentUI((s) => s.refreshMessages);

  const branches = repository.getBranches(message.id);

  const goToPrevious = useCallback(() => {
    if (!branches) return;
    const newIndex =
      branches.branchIndex <= 0
        ? branches.branchCount - 1 // wrap-around
        : branches.branchIndex - 1;
    repository.switchToBranch(message.id, newIndex);
    refreshMessages();
  }, [repository, message.id, branches, refreshMessages]);

  const goToNext = useCallback(() => {
    if (!branches) return;
    const newIndex =
      branches.branchIndex >= branches.branchCount - 1
        ? 0 // wrap-around
        : branches.branchIndex + 1;
    repository.switchToBranch(message.id, newIndex);
    refreshMessages();
  }, [repository, message.id, branches, refreshMessages]);

  return {
    branchIndex: branches?.branchIndex ?? 0,
    branchCount: branches?.branchCount ?? 1,
    goToPrevious,
    goToNext,
  };
}

// ---------------------------------------------------------------------------
// BranchPicker.Root
// ---------------------------------------------------------------------------

export interface BranchPickerRootProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** If true, hides when there's only one branch (default: true) */
  hideOnSingleBranch?: boolean;
}

export function BranchPickerRoot({
  children,
  hideOnSingleBranch = true,
  ...props
}: BranchPickerRootProps) {
  const { branchCount } = useBranch();

  if (hideOnSingleBranch && branchCount <= 1) return null;

  return (
    <div data-aui="branch-picker-root" className="aui-branch-picker-root" {...props}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BranchPicker.Previous / Next
// ---------------------------------------------------------------------------

export interface BranchPickerButtonProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}

export function BranchPickerPrevious({ children, ...props }: BranchPickerButtonProps) {
  const { goToPrevious } = useBranch();

  return (
    <button
      type="button"
      data-aui="branch-picker-previous"
      className="aui-branch-picker-previous"
      onClick={goToPrevious}
      {...props}
    >
      {children ?? "←"}
    </button>
  );
}

export function BranchPickerNext({ children, ...props }: BranchPickerButtonProps) {
  const { goToNext } = useBranch();

  return (
    <button
      type="button"
      data-aui="branch-picker-next"
      className="aui-branch-picker-next"
      onClick={goToNext}
      {...props}
    >
      {children ?? "→"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// BranchPicker.Count / Number
// ---------------------------------------------------------------------------

export function BranchPickerCount() {
  const { branchCount } = useBranch();
  return (
    <span data-aui="branch-picker-count" className="aui-branch-picker-count">
      {branchCount}
    </span>
  );
}

export function BranchPickerNumber() {
  const { branchIndex } = useBranch();
  return (
    <span data-aui="branch-picker-number" className="aui-branch-picker-number">
      {branchIndex + 1}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const BranchPicker = {
  Root: BranchPickerRoot,
  Previous: BranchPickerPrevious,
  Next: BranchPickerNext,
  Count: BranchPickerCount,
  Number: BranchPickerNumber,
};
