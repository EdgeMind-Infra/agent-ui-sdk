/**
 * BranchPicker Primitive (React Native) — Navigate between message branches.
 *
 * - BranchPicker.Root: Container (auto-hides when only 1 branch)
 * - BranchPicker.Previous / Next: Navigation Pressables (wrap-around)
 * - BranchPicker.Count / Number: Branch count and current index
 */

import { useAgentUI } from "@agent-ui-sdk/core/react";
import { type ReactNode, useCallback } from "react";
import { Pressable, type StyleProp, Text, View, type ViewStyle } from "react-native";
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
      branches.branchIndex <= 0 ? branches.branchCount - 1 : branches.branchIndex - 1;
    repository.switchToBranch(message.id, newIndex);
    refreshMessages();
  }, [repository, message.id, branches, refreshMessages]);

  const goToNext = useCallback(() => {
    if (!branches) return;
    const newIndex =
      branches.branchIndex >= branches.branchCount - 1 ? 0 : branches.branchIndex + 1;
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

export interface BranchPickerRootProps {
  children: ReactNode;
  hideOnSingleBranch?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function BranchPickerRoot({
  children,
  hideOnSingleBranch = true,
  style,
}: BranchPickerRootProps) {
  const { branchCount } = useBranch();

  if (hideOnSingleBranch && branchCount <= 1) return null;

  return (
    <View style={style} testID="aui-branch-picker-root">
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// BranchPicker.Previous / Next
// ---------------------------------------------------------------------------

export interface BranchPickerButtonProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function BranchPickerPrevious({ children, style }: BranchPickerButtonProps) {
  const { goToPrevious } = useBranch();

  return (
    <Pressable
      onPress={goToPrevious}
      style={style}
      testID="aui-branch-picker-previous"
      accessibilityRole="button"
      accessibilityLabel="Previous branch"
    >
      {children ?? <Text>{"←"}</Text>}
    </Pressable>
  );
}

export function BranchPickerNext({ children, style }: BranchPickerButtonProps) {
  const { goToNext } = useBranch();

  return (
    <Pressable
      onPress={goToNext}
      style={style}
      testID="aui-branch-picker-next"
      accessibilityRole="button"
      accessibilityLabel="Next branch"
    >
      {children ?? <Text>{"→"}</Text>}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// BranchPicker.Count / Number
// ---------------------------------------------------------------------------

export interface BranchPickerTextProps {
  style?: StyleProp<ViewStyle>;
}

export function BranchPickerCount({ style }: BranchPickerTextProps) {
  const { branchCount } = useBranch();
  return (
    <Text style={style} testID="aui-branch-picker-count">
      {branchCount}
    </Text>
  );
}

export function BranchPickerNumber({ style }: BranchPickerTextProps) {
  const { branchIndex } = useBranch();
  return (
    <Text style={style} testID="aui-branch-picker-number">
      {branchIndex + 1}
    </Text>
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
