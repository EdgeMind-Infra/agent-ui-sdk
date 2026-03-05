"use client";

import { Chat, useBranchedChat } from "@agent-ui-sdk/react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useRef, useState } from "react";

export default function Home() {
  const [thinking, setThinking] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const optionsRef = useRef({ thinking, webSearch });
  optionsRef.current = { thinking, webSearch };
  const [transport] = useState(() => new DefaultChatTransport({ body: () => optionsRef.current }));
  const chatHelpers = useChat({ transport });
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
          enableThinking: true,
          enableWebSearch: true,
          thinkingActive: thinking,
          webSearchActive: webSearch,
          onThinkingToggle: setThinking,
          onWebSearchToggle: setWebSearch,
        }}
        className="mx-auto w-full max-w-3xl"
      />
    </div>
  );
}
