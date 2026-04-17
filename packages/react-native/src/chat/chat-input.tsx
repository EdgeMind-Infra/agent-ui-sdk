import { useCallback, useState } from "react";
import { View } from "react-native";
import { cn } from "../lib/utils";
import type { ChatInputProps } from "../types";
import { Button } from "../ui/button";
import { Text } from "../ui/text";
import { Textarea } from "../ui/textarea";
import { useChatContext } from "./chat-provider";

export function ChatInput({ className, placeholder = "Send a message..." }: ChatInputProps) {
  const { chatHelpers } = useChatContext();
  const { sendMessage, stop, status } = chatHelpers;
  const [text, setText] = useState("");

  const isStreaming = status === "streaming" || status === "submitted";
  const canSend = text.trim().length > 0 && !isStreaming;

  const handleSend = useCallback(() => {
    if (!text.trim()) return;
    sendMessage({ text: text.trim() });
    setText("");
  }, [text, sendMessage]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  return (
    <View className={cn("border-border bg-background border-t px-4 pb-4 pt-2", className)}>
      <View className="bg-card border-border flex-row items-end rounded-xl border px-3 py-1">
        <Textarea
          className="min-h-10 flex-1 border-0 bg-transparent px-0 py-2 shadow-none"
          placeholder={placeholder}
          placeholderClassName="text-muted-foreground"
          value={text}
          onChangeText={setText}
          multiline
          numberOfLines={1}
          onSubmitEditing={canSend ? handleSend : undefined}
          blurOnSubmit={false}
        />
        {isStreaming ? (
          <Button variant="ghost" size="icon" className="mb-1 size-8" onPress={handleStop}>
            <Text>◼</Text>
          </Button>
        ) : (
          <Button
            variant="default"
            size="icon"
            className="mb-1 size-8"
            disabled={!canSend}
            onPress={handleSend}
          >
            <Text>↑</Text>
          </Button>
        )}
      </View>
    </View>
  );
}
