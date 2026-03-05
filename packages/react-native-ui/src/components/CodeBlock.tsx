import type { FC } from "react";
import {
  Clipboard,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../theme/useTheme";

// ─── CodeBlock ────────────────────────────────────────────────────────────

export interface CodeBlockProps {
  code: string;
  language?: string;
  style?: StyleProp<ViewStyle>;
}

export const CodeBlock: FC<CodeBlockProps> = ({ code, language = "text", style }) => {
  const t = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: t.colors.border,
          borderRadius: t.borderRadius.md,
          backgroundColor: t.colors.background,
        },
        style,
      ]}
    >
      {/* Header row */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: t.colors.muted,
            borderBottomColor: t.colors.border,
          },
        ]}
      >
        <Text style={[styles.langLabel, { color: t.colors.mutedForeground }]}>
          {language.toLowerCase()}
        </Text>
        <Pressable
          hitSlop={8}
          onPress={() => Clipboard.setString(code)}
          style={styles.copyBtn}
          accessibilityRole="button"
          accessibilityLabel="Copy code"
        >
          <Text style={[styles.copyBtnText, { color: t.colors.mutedForeground }]}>⎘</Text>
        </Pressable>
      </View>

      {/* Scrollable code area */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Text
          style={[
            styles.code,
            {
              color: t.colors.foreground,
              padding: t.spacing[4],
            },
          ]}
          selectable
        >
          {code}
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  langLabel: {
    fontFamily: "Menlo",
    fontSize: 11,
    textTransform: "lowercase",
  },
  copyBtn: {
    padding: 4,
  },
  copyBtnText: {
    fontSize: 14,
  },
  code: {
    fontFamily: "Menlo",
    fontSize: 13,
    lineHeight: 20,
  },
});
