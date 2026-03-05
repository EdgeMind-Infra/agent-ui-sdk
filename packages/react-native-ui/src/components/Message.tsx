import type { AnyUIMessage, AnyUIMessagePart } from "@agent-ui-sdk/core";
import { Message as MessagePrimitive } from "@agent-ui-sdk/react-native";
import type { ComponentType, FC, ReactNode } from "react";
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useTheme } from "../theme/useTheme";

// ─── TextPart (default) ───────────────────────────────────────────────────

export interface TextPartProps {
  part: AnyUIMessagePart;
}

export const TextPart: FC<TextPartProps> = ({ part }) => {
  const t = useTheme();
  if (part.type !== "text") return null;
  return (
    <Text style={[styles.textPart, { color: t.colors.foreground }]}>
      {(part as { text: string }).text}
    </Text>
  );
};

// ─── UserMessage ──────────────────────────────────────────────────────────

export interface UserMessageProps {
  message: AnyUIMessage;
  index: number;
  components?: { Text?: ComponentType<TextPartProps> };
  style?: StyleProp<ViewStyle>;
}

export const UserMessage: FC<UserMessageProps> = ({ message, index, components, style }) => {
  const t = useTheme();
  const TextComponent = (components?.Text ?? TextPart) as ComponentType<{
    part: AnyUIMessagePart;
    index: number;
  }>;

  return (
    <MessagePrimitive.Root
      message={message}
      index={index}
      style={StyleSheet.compose(styles.userRow, style as StyleProp<ViewStyle>)}
    >
      <View
        style={[
          styles.userBubble,
          { backgroundColor: t.colors.primary, borderRadius: t.borderRadius.lg },
        ]}
      >
        <MessagePrimitive.Parts components={{ Text: TextComponent }} />
      </View>
    </MessagePrimitive.Root>
  );
};

// ─── AssistantMessage ─────────────────────────────────────────────────────

export interface AssistantMessageProps {
  message: AnyUIMessage;
  index: number;
  components?: {
    Text?: ComponentType<TextPartProps>;
    Reasoning?: ComponentType<{ part: AnyUIMessagePart; index: number }>;
    ToolCall?: ComponentType<{ part: AnyUIMessagePart; index: number }>;
  };
  actions?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const AssistantMessage: FC<AssistantMessageProps> = ({
  message,
  index,
  components,
  actions,
  style,
}) => {
  const TextComponent = (components?.Text ?? TextPart) as ComponentType<{
    part: AnyUIMessagePart;
    index: number;
  }>;

  return (
    <MessagePrimitive.Root
      message={message}
      index={index}
      style={StyleSheet.compose(styles.assistantRow, style as StyleProp<ViewStyle>)}
    >
      <View style={styles.assistantContent}>
        <MessagePrimitive.Parts
          components={{
            Text: TextComponent,
            Reasoning: components?.Reasoning,
            ToolCall: components?.ToolCall as any,
          }}
        />
      </View>
      {actions && <View style={styles.actionsRow}>{actions}</View>}
    </MessagePrimitive.Root>
  );
};

const styles = StyleSheet.create({
  userRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 4,
    width: "100%",
  },
  userBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  assistantRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 4,
    width: "100%",
  },
  assistantContent: {
    maxWidth: "92%",
  },
  actionsRow: {
    flexDirection: "row",
    marginTop: 4,
    gap: 4,
  },
  textPart: {
    fontSize: 14,
    lineHeight: 20,
  },
});
