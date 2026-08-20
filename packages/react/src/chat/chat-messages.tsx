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
  const { getBranches, getBranchCount, onSwitchBranch, onRestoreCheckpoint } = config;

  const MessageComponent = components.Message ?? ChatMessage;

  return (
    <Conversation className={className}>
      <ConversationContent className="max-w-3xl mx-auto">
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          // Ask for the count first (allocation-free) and only materialise the array when there
          // really are siblings to switch between. `getBranches()` returns a fresh array every
          // call, so handing one to every message would give each a new prop identity per render
          // and ChatMessage's memo would never hit.
          const multiBranch =
            (getBranchCount?.(message.id) ?? 0) > 1 ? getBranches?.(message.id) : undefined;

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
                  isStreaming={isStreaming && isLast}
                  branches={multiBranch}
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
              // Only the last message renders differently while streaming; handing the flag to
              // the history just makes it re-render whenever streaming flips.
              isStreaming={isStreaming && isLast}
              branches={multiBranch}
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
