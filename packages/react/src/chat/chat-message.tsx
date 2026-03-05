/** biome-ignore-all lint/suspicious/noArrayIndexKey: message parts use index as key */
"use client";

import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Message, MessageAction, MessageContent } from "src/components/ai-elements/message";
import { Button } from "src/components/ui/button";
import type { ChatMessageProps } from "../types";
import { useChatContext } from "./chat-provider";
import { ReasoningPart as DefaultReasoningPart } from "./parts/reasoning-part";
import { SourcePart as DefaultSourcePart } from "./parts/source-part";
import { TextPart as DefaultTextPart } from "./parts/text-part";
import { ToolPart as DefaultToolPart } from "./parts/tool-part";

function CopyAction({ text, messageId }: { text: string; messageId: string }) {
  const { config } = useChatContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (config.onCopy) {
      config.onCopy(messageId, text);
    } else {
      navigator.clipboard.writeText(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [config, messageId, text]);

  return (
    <MessageAction tooltip={copied ? "Copied" : "Copy"} onClick={handleCopy}>
      {copied ? <CheckIcon size={14} /> : <ClipboardIcon size={14} />}
    </MessageAction>
  );
}

function RegenerateAction({ messageId }: { messageId: string }) {
  const { config } = useChatContext();

  const handleRegenerate = useCallback(() => {
    config.onRegenerate?.(messageId);
  }, [config, messageId]);

  if (!config.onRegenerate) return null;

  return (
    <MessageAction tooltip="Retry" onClick={handleRegenerate}>
      <RefreshCwIcon size={14} />
    </MessageAction>
  );
}

function BranchSelector({
  branches,
  currentId,
  onSwitch,
}: {
  branches: readonly { id: string }[];
  currentId: string;
  onSwitch: (messageId: string) => void;
}) {
  const currentIndex = useMemo(
    () => branches.findIndex((b) => b.id === currentId),
    [branches, currentId],
  );

  const goPrev = useCallback(() => {
    const prev = currentIndex > 0 ? currentIndex - 1 : branches.length - 1;
    const target = branches[prev];
    if (target) onSwitch(target.id);
  }, [branches, currentIndex, onSwitch]);

  const goNext = useCallback(() => {
    const next = currentIndex < branches.length - 1 ? currentIndex + 1 : 0;
    const target = branches[next];
    if (target) onSwitch(target.id);
  }, [branches, currentIndex, onSwitch]);

  return (
    <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={goPrev}>
        <ChevronLeftIcon size={12} />
      </Button>
      <span className="tabular-nums">
        {currentIndex + 1}/{branches.length}
      </span>
      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={goNext}>
        <ChevronRightIcon size={12} />
      </Button>
    </div>
  );
}

export function ChatMessage({
  message,
  isLastMessage,
  isStreaming,
  branches,
  onSwitchBranch,
}: ChatMessageProps) {
  const { components } = useChatContext();

  const TextPartComponent = components.TextPart ?? DefaultTextPart;
  const ReasoningPartComponent = components.ReasoningPart ?? DefaultReasoningPart;
  const ToolPartComponent = components.ToolPart ?? DefaultToolPart;
  const SourcePartComponent = components.SourcePart ?? DefaultSourcePart;

  // Collect source-url parts
  const sources = message.parts
    .filter(
      (part): part is Extract<typeof part, { type: "source-url" }> => part.type === "source-url",
    )
    .map((part) => ({
      sourceId: part.sourceId,
      url: part.url,
      title: part.title,
    }));

  // Consolidate reasoning parts
  const reasoningParts = message.parts.filter(
    (part): part is Extract<typeof part, { type: "reasoning" }> => part.type === "reasoning",
  );
  const reasoningText = reasoningParts.map((part) => part.text).join("\n\n");
  const hasReasoning = reasoningParts.length > 0;

  // Check if reasoning is still streaming
  const lastPart = message.parts.at(-1);
  const isReasoningStreaming = isLastMessage && isStreaming && lastPart?.type === "reasoning";

  // Extract text for copy / edit
  const messageText = message.parts
    .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("\n\n");

  const isUser = message.role === "user";
  const showActions = !isStreaming || !isLastMessage;
  const hasBranches = branches && branches.length > 1 && onSwitchBranch;

  return (
    <Message from={message.role}>
      <MessageContent>
        {/* Sources at the top */}
        {sources.length > 0 && <SourcePartComponent sources={sources} />}

        {/* Consolidated reasoning */}
        {hasReasoning && (
          <ReasoningPartComponent text={reasoningText} isStreaming={isReasoningStreaming} />
        )}

        {/* Text and tool parts in order */}
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <TextPartComponent
                key={`${message.id}-${i}`}
                text={part.text}
                messageId={message.id}
                partIndex={i}
              />
            );
          }

          if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
            const toolPart = part as {
              type: string;
              toolName?: string;
              toolCallId: string;
              state: string;
              input?: unknown;
              output?: unknown;
              errorText?: string;
            };
            return (
              <ToolPartComponent
                key={`${message.id}-${i}`}
                part={toolPart}
                messageId={message.id}
                partIndex={i}
              />
            );
          }

          // reasoning and source-url are handled above, skip here
          return null;
        })}
      </MessageContent>

      {/* Footer: branch selector + actions on one row */}
      {/* Last message: always visible. Others: visible on hover only. */}
      {showActions && messageText && (
        <div
          className={`flex items-center gap-1 ${isUser ? "justify-end" : "justify-start"} ${
            isLastMessage ? "" : "opacity-0 transition-opacity group-hover:opacity-100"
          }`}
        >
          {hasBranches && (
            <BranchSelector branches={branches} currentId={message.id} onSwitch={onSwitchBranch} />
          )}
          <CopyAction text={messageText} messageId={message.id} />
          {!isUser && <RegenerateAction messageId={message.id} />}
        </div>
      )}
    </Message>
  );
}
