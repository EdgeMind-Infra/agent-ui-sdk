import type { UIMessage } from "ai";
import { useCallback, useRef, useState } from "react";
import { FlatList, type NativeScrollEvent, type NativeSyntheticEvent, View } from "react-native";
import { cn } from "../lib/utils";
import type { ChatMessagesProps } from "../types";
import { Skeleton } from "../ui/skeleton";
import { ChatMessage } from "./chat-message";
import { useChatContext } from "./chat-provider";

export function ChatMessages({ className }: ChatMessagesProps) {
  const { chatHelpers, components } = useChatContext();
  const { messages, status } = chatHelpers;
  const isStreaming = status === "streaming";

  const MessageComponent = components.Message ?? ChatMessage;

  const listRef = useRef<FlatList<UIMessage>>(null);
  const [_isAtBottom, setIsAtBottom] = useState(true);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // In an inverted list, "bottom" means contentOffset.y is near 0
    const { contentOffset } = e.nativeEvent;
    setIsAtBottom(contentOffset.y < 50);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: UIMessage; index: number }) => {
      // In inverted list, index 0 is the last message
      const actualIndex = messages.length - 1 - index;
      const isLast = actualIndex === messages.length - 1;

      return <MessageComponent message={item} isLastMessage={isLast} isStreaming={isStreaming} />;
    },
    [messages.length, isStreaming, MessageComponent],
  );

  const keyExtractor = useCallback((item: UIMessage) => item.id, []);

  // Inverted list needs reversed data
  const invertedMessages = [...messages].reverse();

  return (
    <View className={cn("flex-1", className)}>
      <FlatList
        ref={listRef}
        data={invertedMessages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        inverted
        onScroll={handleScroll}
        scrollEventThrottle={100}
        windowSize={10}
        maxToRenderPerBatch={10}
        contentContainerClassName="pb-2"
        ListFooterComponent={
          status === "submitted" ? (
            <View className="items-start px-4 py-2">
              <Skeleton className="h-4 w-32 rounded-md" />
            </View>
          ) : null
        }
      />
    </View>
  );
}
