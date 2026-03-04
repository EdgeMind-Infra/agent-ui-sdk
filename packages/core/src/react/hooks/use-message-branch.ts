import { useCallback } from "react";
import type { BranchState } from "../../index";
import { useAgentUI } from "../provider";

/**
 * Hook for branch navigation on a specific message.
 *
 * @example
 * ```tsx
 * const { branches, goToPrevious, goToNext } = useMessageBranch(message.id);
 * // branches = { branchIndex: 0, branchCount: 3 }
 * ```
 */
export function useMessageBranch(messageId: string) {
  const repository = useAgentUI((s) => s.repository);

  const branches: BranchState | null = repository.getBranches(messageId);

  const goToPrevious = useCallback(() => {
    if (branches && branches.branchIndex > 0) {
      repository.switchToBranch(messageId, branches.branchIndex - 1);
    }
  }, [repository, messageId, branches]);

  const goToNext = useCallback(() => {
    if (branches && branches.branchIndex < branches.branchCount - 1) {
      repository.switchToBranch(messageId, branches.branchIndex + 1);
    }
  }, [repository, messageId, branches]);

  return {
    branches,
    hasPrevious: branches ? branches.branchIndex > 0 : false,
    hasNext: branches ? branches.branchIndex < branches.branchCount - 1 : false,
    goToPrevious,
    goToNext,
  };
}
