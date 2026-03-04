/**
 * Thread Primitive (React Native) — Container for a chat conversation.
 *
 * Uses FlatList with inverted scroll (standard RN chat pattern).
 *
 * - Thread.Root: Context Provider managing messages/scroll state
 * - Thread.Messages: FlatList with inverted scroll + sticky-bottom
 * - Thread.Empty: Conditional render when no messages
 * - Thread.ScrollToBottom: Pressable that scrolls to bottom
 */

import type { AnyUIMessage } from "@agent-ui-sdk/core";
import { useAgentUI } from "@agent-ui-sdk/core/react";
import {
  type ComponentType,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import {
  type FlatList,
  type FlatListProps,
  Pressable,
  FlatList as RNFlatList,
  type StyleProp,
  Text,
  View,
  type ViewStyle,
} from "react-native";

// ---------------------------------------------------------------------------
// Thread Context
// ---------------------------------------------------------------------------

interface ThreadContextValue {
  messages: AnyUIMessage[];
  isAtBottom: boolean;
  setIsAtBottom: (v: boolean) => void;
  scrollToBottom: () => void;
  listRef: React.RefObject<FlatList<AnyUIMessage> | null>;
  isLoading: boolean;
  onLoadMore?: () => Promise<void> | void;
}

const ThreadContext = createContext<ThreadContextValue | null>(null);

export function useThreadContext(): ThreadContextValue {
  const ctx = useContext(ThreadContext);
  if (!ctx) throw new Error("useThreadContext must be used within <Thread.Root>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Thread.Root
// ---------------------------------------------------------------------------

export interface ThreadRootProps {
  children: ReactNode;
  /** Override messages (otherwise reads from AgentUIProvider) */
  messages?: AnyUIMessage[];
  /** Whether the thread is loading */
  isLoading?: boolean;
  /** Callback when user scrolls to top — load older messages */
  onLoadMore?: () => Promise<void> | void;
  style?: StyleProp<ViewStyle>;
}

export function ThreadRoot({
  children,
  messages: messagesProp,
  isLoading = false,
  onLoadMore,
  style,
}: ThreadRootProps) {
  const storeMessages = useAgentUI((s) => s.messages);
  const messages = messagesProp ?? storeMessages;
  const [isAtBottom, setIsAtBottom] = useState(true);
  const listRef = useRef<FlatList<AnyUIMessage>>(null);

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    setIsAtBottom(true);
  }, []);

  const ctx: ThreadContextValue = {
    messages,
    isAtBottom,
    setIsAtBottom,
    scrollToBottom,
    listRef,
    isLoading,
    onLoadMore,
  };

  return (
    <ThreadContext.Provider value={ctx}>
      <View style={style} testID="aui-thread-root" accessibilityRole="list">
        {children}
      </View>
    </ThreadContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Thread.Messages
// ---------------------------------------------------------------------------

export interface ThreadMessagesProps {
  /** Component to render each message */
  components: {
    Message: ComponentType<{ message: AnyUIMessage; index: number }>;
  };
  /** Additional FlatList props */
  flatListProps?: Partial<FlatListProps<AnyUIMessage>>;
  style?: StyleProp<ViewStyle>;
}

export function ThreadMessages({
  components: { Message },
  flatListProps,
  style,
}: ThreadMessagesProps) {
  const { messages, listRef, setIsAtBottom, onLoadMore } = useThreadContext();

  const renderItem = useCallback(
    ({ item, index }: { item: AnyUIMessage; index: number }) => (
      <Message message={item} index={messages.length - 1 - index} />
    ),
    [Message, messages.length],
  );

  const keyExtractor = useCallback((item: AnyUIMessage) => item.id, []);

  const handleScroll = useCallback(
    (e: { nativeEvent: { contentOffset: { y: number } } }) => {
      const threshold = 50;
      setIsAtBottom(e.nativeEvent.contentOffset.y < threshold);
    },
    [setIsAtBottom],
  );

  // Inverted FlatList: newest messages at bottom (index 0 visually at bottom)
  const reversedMessages = [...messages].reverse();

  return (
    <RNFlatList
      ref={listRef}
      data={reversedMessages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      inverted
      onScroll={handleScroll}
      scrollEventThrottle={16}
      onEndReached={() => onLoadMore?.()}
      onEndReachedThreshold={0.1}
      style={style}
      testID="aui-thread-messages"
      {...flatListProps}
    />
  );
}

// ---------------------------------------------------------------------------
// Thread.Empty
// ---------------------------------------------------------------------------

export interface ThreadEmptyProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ThreadEmpty({ children, style }: ThreadEmptyProps) {
  const { messages, isLoading } = useThreadContext();
  if (messages.length > 0 || isLoading) return null;
  return (
    <View style={style} testID="aui-thread-empty">
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Thread.ScrollToBottom
// ---------------------------------------------------------------------------

export interface ThreadScrollToBottomProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ThreadScrollToBottom({ children, style }: ThreadScrollToBottomProps) {
  const { isAtBottom, scrollToBottom } = useThreadContext();

  if (isAtBottom) return null;

  return (
    <Pressable
      onPress={scrollToBottom}
      style={style}
      testID="aui-thread-scroll-to-bottom"
      accessibilityRole="button"
      accessibilityLabel="Scroll to bottom"
    >
      {children ?? <Text>{"↓"}</Text>}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Thread = {
  Root: ThreadRoot,
  Messages: ThreadMessages,
  Empty: ThreadEmpty,
  ScrollToBottom: ThreadScrollToBottom,
};
