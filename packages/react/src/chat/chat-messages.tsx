"use client";

import { memo, useCallback } from "react";
import {
  Checkpoint,
  CheckpointIcon,
  CheckpointTrigger,
} from "src/components/ai-elements/checkpoint";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "src/components/ai-elements/conversation";
import { Spinner } from "src/components/ui/spinner";
import type { ChatMessagesProps } from "../types";
import { ChatMessage } from "./chat-message";
import { useChatContext } from "./chat-provider";

const CheckpointItem = memo(
  ({ messageId, onRestore }: { messageId: string; onRestore: (messageId: string) => void }) => {
    const handleClick = useCallback(() => onRestore(messageId), [onRestore, messageId]);

    return (
      <Checkpoint className="w-full overflow-visible opacity-0 transition-opacity group-hover/restore:opacity-100">
        <CheckpointIcon />
        <CheckpointTrigger onClick={handleClick} tooltip="Restores chat to this point">
          Restore checkpoint
        </CheckpointTrigger>
      </Checkpoint>
    );
  },
);

CheckpointItem.displayName = "CheckpointItem";

export function ChatMessages({ className }: ChatMessagesProps) {
  const { chatHelpers, components, config } = useChatContext();
  const { messages, status } = chatHelpers;
  const isStreaming = status === "streaming";
  const { getBranches, onSwitchBranch, onRestoreCheckpoint } = config;

  const MessageComponent = components.Message ?? ChatMessage;

  return (
    <Conversation className={className}>
      <ConversationContent>
        {messages.map((message, index) => {
          const branches = getBranches?.(message.id);
          const isLast = index === messages.length - 1;

          const prevMessage = index > 0 ? messages[index - 1] : undefined;
          const showCheckpoint =
            onRestoreCheckpoint &&
            message.role === "user" &&
            !isLast &&
            prevMessage != null &&
            !isStreaming;

          if (showCheckpoint) {
            return (
              <div key={message.id} className="group/restore relative overflow-hidden">
                <CheckpointItem messageId={prevMessage.id} onRestore={onRestoreCheckpoint} />
                <MessageComponent
                  message={message}
                  isLastMessage={isLast}
                  isStreaming={isStreaming}
                  branches={branches}
                  onSwitchBranch={onSwitchBranch}
                />
              </div>
            );
          }

          return (
            <MessageComponent
              key={message.id}
              message={message}
              isLastMessage={isLast}
              isStreaming={isStreaming}
              branches={branches}
              onSwitchBranch={onSwitchBranch}
            />
          );
        })}
        {status === "submitted" && <Spinner />}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
