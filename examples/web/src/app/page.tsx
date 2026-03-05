"use client";

import { Chat, useBranchedChat } from "@agent-ui-sdk/react";
import { useChat } from "@ai-sdk/react";
export default function Home() {
  const chatHelpers = useChat();
  const branchedChat = useBranchedChat({ chatHelpers });

  return (
    <div className="flex h-screen bg-background">
      <Chat
        chatHelpers={branchedChat}
        config={{
          getBranches: branchedChat.getBranches,
          onSwitchBranch: branchedChat.switchBranch,
          onRestoreCheckpoint: branchedChat.restoreCheckpoint,
          onRegenerate: (messageId: string) => {
            branchedChat.regenerate?.({ messageId });
          },
          suggestions: [
            "What is the meaning of life?",
            "Explain quantum computing",
            "Write a haiku about coding",
          ],
        }}
        className="mx-auto w-full max-w-3xl"
      />
    </div>
  );
}
