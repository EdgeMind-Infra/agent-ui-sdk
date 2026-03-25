import type { UIMessage } from "ai";
import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  View,
} from "react-native";
import { ChatMessage } from "../chat/chat-message";
import { useChatContext } from "../chat/chat-provider";
import { cn } from "../lib/utils";

import { Skeleton } from "../ui/skeleton";
import { Text } from "../ui/text";

// Try to use FlashList if available, fallback to FlatList
let FlashListComponent: typeof FlatList | null = null;
try {
  const mod = require("@shopify/flash-list");
  FlashListComponent = mod.FlashList;
} catch {
  // FlashList not installed
}

const ListComponent = FlashListComponent ?? FlatList;

export interface ConversationProps {
  className?: string;
  /** Content to show when there are no messages */
  emptyState?: React.ReactNode;
  /** Whether to show the scroll-to-bottom button */
  showScrollButton?: boolean;
}

export function Conversation({
  className,
  emptyState,
  showScrollButton = true,
}: ConversationProps) {
  const { chatHelpers, components } = useChatContext();
  const { messages, status } = chatHelpers;
  const isStreaming = status === "streaming";

  const MessageComponent = components.Message ?? ChatMessage;

  const listRef = useRef<FlatList<UIMessage>>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset } = e.nativeEvent;
    setIsAtBottom(contentOffset.y < 50);
  }, []);

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: UIMessage; index: number }) => {
      const actualIndex = messages.length - 1 - index;
      const isLast = actualIndex === messages.length - 1;

      return <MessageComponent message={item} isLastMessage={isLast} isStreaming={isStreaming} />;
    },
    [messages.length, isStreaming, MessageComponent],
  );

  const keyExtractor = useCallback((item: UIMessage) => item.id, []);

  if (messages.length === 0 && emptyState) {
    return <View className={cn("flex-1", className)}>{emptyState}</View>;
  }

  const invertedMessages = [...messages].reverse();

  const extraProps = FlashListComponent
    ? { estimatedItemSize: 100 }
    : { windowSize: 10, maxToRenderPerBatch: 10 };

  return (
    <View className={cn("flex-1", className)}>
      <ListComponent
        ref={listRef as React.RefObject<FlatList<UIMessage>>}
        data={invertedMessages}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        inverted
        onScroll={handleScroll}
        scrollEventThrottle={100}
        contentContainerClassName="pb-2"
        ListFooterComponent={
          status === "submitted" ? (
            <View className="items-start px-4 py-2">
              <Skeleton className="h-4 w-32 rounded-md" />
            </View>
          ) : null
        }
        {...extraProps}
      />
      {showScrollButton && !isAtBottom ? (
        <ConversationScrollButton onPress={scrollToBottom} />
      ) : null}
    </View>
  );
}

export interface ConversationScrollButtonProps {
  onPress: () => void;
  className?: string;
}

export function ConversationScrollButton({ onPress, className }: ConversationScrollButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        "bg-background border-border absolute bottom-4 right-4 size-10 items-center justify-center rounded-full border shadow-sm",
        className,
      )}
    >
      <Text className="text-foreground text-base">↓</Text>
    </Pressable>
  );
}

export interface ConversationEmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function ConversationEmptyState({
  title,
  description,
  className,
}: ConversationEmptyStateProps) {
  return (
    <View className={cn("flex-1 items-center justify-center px-8", className)}>
      {title ? (
        <Text className="text-foreground text-center text-xl font-semibold">{title}</Text>
      ) : null}
      {description ? (
        <Text className="text-muted-foreground mt-2 text-center text-sm">{description}</Text>
      ) : null}
    </View>
  );
}
