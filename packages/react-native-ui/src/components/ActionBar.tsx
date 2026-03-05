import { ActionBar as ActionBarPrimitive } from "@agent-ui-sdk/react-native";
import type { FC } from "react";
import { Clipboard, type StyleProp, StyleSheet, Text, type ViewStyle } from "react-native";
import { useTheme } from "../theme/useTheme";

// ─── ActionBar ────────────────────────────────────────────────────────────

export interface ActionBarProps {
  showEdit?: boolean;
  showReload?: boolean;
  showFeedback?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const ActionBar: FC<ActionBarProps> = ({
  showEdit = false,
  showReload = false,
  showFeedback = false,
  style,
}) => {
  const t = useTheme();

  const btnStyle = [
    styles.btn,
    {
      borderRadius: t.borderRadius.sm,
    },
  ];

  return (
    <ActionBarPrimitive.Root style={StyleSheet.compose(styles.root, style as StyleProp<ViewStyle>)}>
      {/* Copy */}
      <ActionBarPrimitive.Copy
        onCopy={(text) => {
          // RN 0.73+ uses Clipboard from react-native
          Clipboard.setString(text);
        }}
        style={btnStyle}
        copiedChildren={<Text style={[styles.btnText, { color: "#10b981" }]}>✓</Text>}
      >
        <Text style={[styles.btnText, { color: t.colors.mutedForeground }]}>⎘</Text>
      </ActionBarPrimitive.Copy>

      {/* Edit */}
      {showEdit && (
        <ActionBarPrimitive.Edit style={btnStyle}>
          <Text style={[styles.btnText, { color: t.colors.mutedForeground }]}>✎</Text>
        </ActionBarPrimitive.Edit>
      )}

      {/* Reload */}
      {showReload && (
        <ActionBarPrimitive.Reload style={btnStyle}>
          <Text style={[styles.btnText, { color: t.colors.mutedForeground }]}>↺</Text>
        </ActionBarPrimitive.Reload>
      )}

      {/* Feedback */}
      {showFeedback && (
        <>
          <ActionBarPrimitive.FeedbackPositive style={btnStyle}>
            <Text style={[styles.btnText, { color: t.colors.mutedForeground }]}>👍</Text>
          </ActionBarPrimitive.FeedbackPositive>
          <ActionBarPrimitive.FeedbackNegative style={btnStyle}>
            <Text style={[styles.btnText, { color: t.colors.mutedForeground }]}>👎</Text>
          </ActionBarPrimitive.FeedbackNegative>
        </>
      )}
    </ActionBarPrimitive.Root>
  );
};

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  btn: {
    // Minimum 44pt touch target
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  },
  btnText: {
    fontSize: 16,
  },
});
