import { Composer as ComposerPrimitive } from "@agent-ui-sdk/react-native";
import type { FC, ReactNode } from "react";
import { Platform, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "../theme/useTheme";

// ─── Composer ─────────────────────────────────────────────────────────────

export interface ComposerProps {
  placeholder?: string;
  /** Slot for leading elements (e.g., attachment button) */
  leading?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const Composer: FC<ComposerProps> = ({
  placeholder = "Send a message…",
  leading,
  style,
}) => {
  const t = useTheme();

  return (
    <ComposerPrimitive.Root style={StyleSheet.compose(styles.root, style as StyleProp<ViewStyle>)}>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: t.colors.background,
            borderColor: t.colors.border,
            borderRadius: t.borderRadius.lg,
          },
        ]}
      >
        {leading && <View style={styles.leadingSlot}>{leading}</View>}

        <ComposerPrimitive.Input
          placeholder={placeholder}
          placeholderTextColor={t.colors.mutedForeground}
          style={[
            styles.textInput,
            {
              color: t.colors.foreground,
              maxHeight: 120,
            },
          ]}
          multiline
          submitOnReturn={Platform.OS !== "ios"}
        />

        <ComposerPrimitive.Send
          style={[
            styles.sendBtn,
            { backgroundColor: t.colors.primary, borderRadius: t.borderRadius.full },
          ]}
        />
      </View>
    </ComposerPrimitive.Root>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  leadingSlot: {
    justifyContent: "flex-end",
    paddingBottom: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    paddingVertical: 0,
    // Remove default TextInput outline on web
    ...(Platform.OS === "web" ? { outlineWidth: 0 } : {}),
  },
  sendBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
});
