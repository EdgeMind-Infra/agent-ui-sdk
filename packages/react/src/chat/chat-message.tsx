/** biome-ignore-all lint/suspicious/noArrayIndexKey: message parts use index as key */
"use client";

import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardIcon,
  RefreshCwIcon,
} from "lucide-react";
import { memo, useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { Message, MessageAction, MessageContent } from "src/components/ai-elements/message";
import { Button } from "src/components/ui/button";
import {
  type ChatMessageProps,
  DEFAULT_CHAT_LABELS,
  type ToolCallState,
  type ToolUIRendererComponent,
} from "../types";
import { useChatStatic } from "./chat-provider";
import { ReasoningPart as DefaultReasoningPart } from "./parts/reasoning-part";
import { SourcePart as DefaultSourcePart } from "./parts/source-part";
import { TextPart as DefaultTextPart } from "./parts/text-part";
import { ToolPart as DefaultToolPart } from "./parts/tool-part";

function CopyAction({ text, messageId }: { text: string; messageId: string }) {
  const { config } = useChatStatic();
  const labels = { ...DEFAULT_CHAT_LABELS, ...config.labels };
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
    <MessageAction tooltip={copied ? labels.copied : labels.copy} onClick={handleCopy}>
      {copied ? <CheckIcon size={14} /> : <ClipboardIcon size={14} />}
    </MessageAction>
  );
}

function RegenerateAction({ messageId }: { messageId: string }) {
  const { config } = useChatStatic();
  const labels = { ...DEFAULT_CHAT_LABELS, ...config.labels };

  const handleRegenerate = useCallback(() => {
    config.onRegenerate?.(messageId);
  }, [config, messageId]);

  if (!config.onRegenerate) return null;

  return (
    <MessageAction tooltip={labels.retry} onClick={handleRegenerate}>
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

/**
 * Extract toolName from a tool part.
 * - Static tool: type is "tool-web_search" → toolName is "web_search"
 * - Dynamic tool: type is "dynamic-tool", toolName is on the part object
 */
function extractToolName(part: { type: string; toolName?: string }): string {
  if (part.type === "dynamic-tool") {
    return part.toolName ?? "unknown";
  }
  // Static tool: "tool-{name}"
  return part.type.replace(/^tool-/, "");
}

/**
 * memo: streaming replaces only the message object currently being generated — every other
 * message keeps its identity. Without memo the whole history re-renders (markdown parsing and
 * all) on every batch of chunks, which is what turns a long thread into a stuttering one.
 * Relies on `useChatStatic()` above: subscribing to the full chat context would push a new
 * value on every chunk and defeat the memo entirely.
 */
export const ChatMessage = memo(function ChatMessage({
  message,
  isLastMessage,
  isStreaming,
  branches,
  onSwitchBranch,
}: ChatMessageProps) {
  const { chatActions, components, config, toolUIRegistry, toolRenderers } = useChatStatic();

  // Wrap addToolApprovalResponse: strip `extra` before passing to AI SDK, then fire the hook
  const wrappedAddToolApprovalResponse = useMemo(() => {
    const original = chatActions.addToolApprovalResponse;
    if (!original) return undefined;
    return (opts: {
      id: string;
      approved: boolean;
      reason?: string;
      extra?: Record<string, unknown>;
    }) => {
      const { extra, ...sdkOpts } = opts;
      original(sdkOpts);
      config.onToolApprovalResponse?.(opts);
    };
  }, [chatActions.addToolApprovalResponse, config.onToolApprovalResponse]);

  // Subscribe to registry changes so we re-render when tools are registered/unregistered
  const registrySnapshot = useSyncExternalStore(
    useCallback((cb: () => void) => toolUIRegistry.subscribe(cb), [toolUIRegistry]),
    useCallback(() => toolUIRegistry.getSnapshot(), [toolUIRegistry]),
  );

  const TextPartComponent = components.TextPart ?? DefaultTextPart;
  const ReasoningPartComponent = components.ReasoningPart ?? DefaultReasoningPart;
  const FallbackToolPartComponent = components.ToolPart ?? DefaultToolPart;
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

        {/* Reasoning, text and tool parts in original stream order */}
        {message.parts.map((part, i) => {
          if (part.type === "reasoning") {
            const isThisReasoningStreaming =
              part.state === "streaming" ||
              (part.state === undefined &&
                isLastMessage &&
                isStreaming &&
                i === message.parts.length - 1);
            return (
              <ReasoningPartComponent
                key={`${message.id}-${i}`}
                text={part.text}
                isStreaming={isThisReasoningStreaming}
              />
            );
          }

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
              state: ToolCallState;
              input?: unknown;
              output?: unknown;
              errorText?: string;
              title?: string;
              approval?: { id: string; approved?: boolean; reason?: string };
            };
            const toolName = extractToolName(toolPart);

            // Four-level fallback: toolRenderers prop → registry → components.ToolPart → DefaultToolPart
            const PerToolRenderer = (toolRenderers?.[toolName] ?? registrySnapshot[toolName]) as
              | ToolUIRendererComponent
              | undefined;

            if (PerToolRenderer) {
              return (
                <PerToolRenderer
                  key={`${message.id}-${i}`}
                  toolName={toolName}
                  toolCallId={toolPart.toolCallId}
                  state={toolPart.state}
                  input={toolPart.input}
                  output={toolPart.output}
                  errorText={toolPart.errorText}
                  title={toolPart.title}
                  messageId={message.id}
                  partIndex={i}
                  approval={toolPart.approval}
                  addToolApprovalResponse={wrappedAddToolApprovalResponse}
                />
              );
            }

            return (
              <FallbackToolPartComponent
                key={`${message.id}-${i}`}
                part={toolPart}
                messageId={message.id}
                partIndex={i}
                addToolApprovalResponse={wrappedAddToolApprovalResponse}
              />
            );
          }

          // source-url is handled above, skip here
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
});
