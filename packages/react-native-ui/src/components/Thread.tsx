import type { AnyUIMessage } from "@agent-ui-sdk/core";
import { Thread as ThreadPrimitive } from "@agent-ui-sdk/react-native";
import { ArrowDownIcon } from "lucide-react-native";
import type { ComponentType, FC, ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../theme/useTheme";

// ─── ScrollToBottomButton ─────────────────────────────────────────────────

const ScrollToBottomButton: FC = () => {
  const t = useTheme();
  return (
    <ThreadPrimitive.ScrollToBottom>
      <Pressable
        style={[
          styles.scrollToBottomBtn,
          {
            backgroundColor: t.colors.background,
            borderColor: t.colors.border,
          },
        ]}
        hitSlop={8}
      >
        <ArrowDownIcon size={16} color={t.colors.mutedForeground} />
      </Pressable>
    </ThreadPrimitive.ScrollToBottom>
  );
};

// ─── EmptyState ───────────────────────────────────────────────────────────

export interface EmptyStateProps {
  title?: string;
  subtitle?: string;
}

export const EmptyState: FC<EmptyStateProps> = ({
  title = "Start a conversation",
  subtitle = "Send a message to get started.",
}) => {
  const t = useTheme();
  return (
    <View style={styles.emptyRoot}>
      <Text style={[styles.emptyTitle, { color: t.colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: t.colors.mutedForeground }]}>{subtitle}</Text>
    </View>
  );
};

// ─── Thread ───────────────────────────────────────────────────────────────

export interface ThreadProps {
  components: {
    Message: ComponentType<{ message: AnyUIMessage; index: number }>;
  };
  messages?: AnyUIMessage[];
  isLoading?: boolean;
  onLoadMore?: () => Promise<void> | void;
  empty?: ReactNode;
  /** Extra content at the bottom (e.g., Composer) */
  footer?: ReactNode;
}

export const Thread: FC<ThreadProps> = ({
  components,
  messages,
  isLoading,
  onLoadMore,
  empty,
  footer,
}) => {
  const t = useTheme();

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: t.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ThreadPrimitive.Root
        messages={messages}
        isLoading={isLoading}
        onLoadMore={onLoadMore}
        style={styles.threadRoot}
      >
        <View style={styles.messagesContainer}>
          <ThreadPrimitive.Messages components={{ Message: components.Message }} />
          <ThreadPrimitive.Empty>{empty ?? <EmptyState />}</ThreadPrimitive.Empty>
        </View>

        {/* Scroll to bottom overlay */}
        <View style={styles.scrollToBottomOverlay} pointerEvents="box-none">
          <ScrollToBottomButton />
        </View>
      </ThreadPrimitive.Root>

      {footer && <View style={[styles.footer, { borderTopColor: t.colors.border }]}>{footer}</View>}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  threadRoot: {
    flex: 1,
    position: "relative",
  },
  messagesContainer: {
    flex: 1,
  },
  scrollToBottomOverlay: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  scrollToBottomBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  footer: {
    borderTopWidth: 1,
  },
  emptyRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
});
