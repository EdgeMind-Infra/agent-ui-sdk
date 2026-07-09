/** biome-ignore-all lint/suspicious/noArrayIndexKey: message parts use index as key */
import { useCallback, useState } from "react";
import { Clipboard, Pressable, View } from "react-native";
import { cn } from "../lib/utils";
import type { ChatMessageProps } from "../types";
import { Text } from "../ui/text";
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
      Clipboard.setString(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [config, messageId, text]);

  return (
    <Pressable className="active:bg-accent rounded-md px-2 py-1" onPress={handleCopy}>
      <Text className="text-muted-foreground text-xs">{copied ? "Copied" : "Copy"}</Text>
    </Pressable>
  );
}

function RegenerateAction({ messageId }: { messageId: string }) {
  const { config } = useChatContext();

  const handleRegenerate = useCallback(() => {
    config.onRegenerate?.(messageId);
  }, [config, messageId]);

  if (!config.onRegenerate) return null;

  return (
    <Pressable className="active:bg-accent rounded-md px-2 py-1" onPress={handleRegenerate}>
      <Text className="text-muted-foreground text-xs">Retry</Text>
    </Pressable>
  );
}

export function ChatMessage({ message, isLastMessage, isStreaming }: ChatMessageProps) {
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

  // Extract text for copy
  const messageText = message.parts
    .filter((part): part is Extract<typeof part, { type: "text" }> => part.type === "text")
    .map((part) => part.text)
    .join("\n\n");

  const isUser = message.role === "user";
  const showActions = !isStreaming || !isLastMessage;

  return (
    <View className={cn("flex gap-1 px-4 py-2", isUser ? "items-end" : "items-start")}>
      {/* Message bubble */}
      <View
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser ? "bg-primary" : "bg-card border-border border",
        )}
      >
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
              <View key={`${message.id}-${i}`} className={isUser ? "text-primary-foreground" : ""}>
                <TextPartComponent text={part.text} messageId={message.id} partIndex={i} />
              </View>
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

          return null;
        })}
      </View>

      {/* Actions */}
      {showActions && messageText && (
        <View
          className={cn("flex-row items-center gap-1", isUser ? "justify-end" : "justify-start")}
        >
          <CopyAction text={messageText} messageId={message.id} />
          {!isUser && <RegenerateAction messageId={message.id} />}
        </View>
      )}
    </View>
  );
}
