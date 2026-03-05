"use client";

import type { AnyUIMessage, AnyUIMessagePart } from "@agent-ui-sdk/core";
import { useAISDKRuntime } from "@agent-ui-sdk/core/ai-sdk";
import { AgentUIProvider } from "@agent-ui-sdk/core/react";
import {
  ActionBar,
  AssistantMessage,
  BranchPicker,
  Composer,
  Reasoning,
  Thread,
  UserMessage,
} from "@agent-ui-sdk/react-ui";
import { useChat } from "@ai-sdk/react";

// ─── Custom text part renderer ─────────────────────────────────────────────

function PlainTextPart({ part }: { part: AnyUIMessagePart }) {
  if (part.type !== "text") return null;
  return <span className="whitespace-pre-wrap">{(part as { text: string }).text}</span>;
}

// ─── Reasoning part renderer ───────────────────────────────────────────────

function ReasoningPart({ part }: { part: AnyUIMessagePart }) {
  if (part.type !== "reasoning") return null;
  return <Reasoning part={part as Parameters<typeof Reasoning>[0]["part"]} />;
}

// ─── Message renderer ──────────────────────────────────────────────────────

function ChatMessage({ message, index }: { message: AnyUIMessage; index: number }) {
  if (message.role === "user") {
    return <UserMessage message={message} index={index} />;
  }

  return (
    <div className="group">
      <AssistantMessage
        message={message}
        index={index}
        components={{ Text: PlainTextPart, Reasoning: ReasoningPart }}
        actions={<ActionBar showReload showFeedback />}
        footer={<BranchPicker className="ml-4 mb-1" />}
      />
    </div>
  );
}

// ─── Main chat UI ──────────────────────────────────────────────────────────

function ChatUI() {
  const chatHelpers = useChat({ api: "/api/chat" });
  useAISDKRuntime({ chatHelpers });

  return (
    <div className="flex h-screen flex-col bg-[var(--aui-background)]">
      <header className="border-b border-[var(--aui-border)] px-4 py-3">
        <h1 className="text-lg font-semibold text-[var(--aui-foreground)]">
          Agent UI SDK — Web Example
        </h1>
      </header>

      <Thread className="flex-1" components={{ Message: ChatMessage }} />

      <div className="border-t border-[var(--aui-border)] p-4">
        <Composer placeholder="Send a message…" />
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <AgentUIProvider>
      <ChatUI />
    </AgentUIProvider>
  );
}
