import type { AnyUIMessage } from "@agent-ui-sdk/core";
import { useAISDKRuntime } from "@agent-ui-sdk/core/ai-sdk";
import { AgentUIProvider } from "@agent-ui-sdk/core/react";
import {
  ActionBar,
  AssistantMessage,
  Composer,
  ThemeProvider,
  Thread,
  UserMessage,
} from "@agent-ui-sdk/react-native-ui";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { StatusBar } from "expo-status-bar";
import { Platform, SafeAreaView, StyleSheet, Text, View } from "react-native";

const API_BASE = Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

// ─── Message renderer ──────────────────────────────────────────────────────

function ChatMessage({ message, index }: { message: AnyUIMessage; index: number }) {
  if (message.role === "user") {
    return <UserMessage message={message} index={index} />;
  }
  return (
    <AssistantMessage
      message={message}
      index={index}
      actions={<ActionBar showReload showFeedback />}
    />
  );
}

// ─── Chat screen ───────────────────────────────────────────────────────────

function ChatScreen() {
  const chatHelpers = useChat({
    transport: new DefaultChatTransport({ api: `${API_BASE}/api/chat` }),
  });
  useAISDKRuntime({ chatHelpers });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agent UI SDK — RN</Text>
      </View>

      <Thread
        components={{ Message: ChatMessage }}
        footer={<Composer placeholder="Send a message…" />}
      />
    </SafeAreaView>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────

export default function Index() {
  return (
    <ThemeProvider>
      <AgentUIProvider>
        <ChatScreen />
      </AgentUIProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
});
