/**
 * Thread Primitive — Container for a chat conversation.
 *
 * Provides:
 * - Thread.Root: Context Provider managing messages/scroll/loading state
 * - Thread.Messages: Virtualized message list (react-virtuoso)
 * - Thread.Empty: Conditional render when no messages
 * - Thread.ScrollToBottom: Sticky-bottom scroll button
 */

import type { AnyUIMessage } from "@agent-ui-sdk/core";
import { useAgentUI } from "@agent-ui-sdk/core/react";
import {
  type ComponentType,
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Thread Context
// ---------------------------------------------------------------------------

interface ThreadContextValue {
  messages: AnyUIMessage[];
  isAtBottom: boolean;
  setIsAtBottom: (v: boolean) => void;
  scrollToBottom: () => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
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

export interface ThreadRootProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Override messages (otherwise reads from AgentUIProvider) */
  messages?: AnyUIMessage[];
  /** Whether the thread is loading (e.g., initial fetch) */
  isLoading?: boolean;
  /** Callback when user scrolls to top — load older messages */
  onLoadMore?: () => Promise<void> | void;
}

export function ThreadRoot({
  children,
  messages: messagesProp,
  isLoading = false,
  onLoadMore,
  ...divProps
}: ThreadRootProps) {
  const storeMessages = useAgentUI((s) => s.messages);
  const messages = messagesProp ?? storeMessages;
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    setIsAtBottom(true);
  }, []);

  const ctx: ThreadContextValue = {
    messages,
    isAtBottom,
    setIsAtBottom,
    scrollToBottom,
    scrollRef,
    isLoading,
    onLoadMore,
  };

  return (
    <ThreadContext.Provider value={ctx}>
      <div data-aui="thread-root" className="aui-thread-root" {...divProps}>
        {children}
      </div>
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
}

export function ThreadMessages({ components: { Message } }: ThreadMessagesProps) {
  const { messages, scrollRef, setIsAtBottom, onLoadMore } = useThreadContext();
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadingMore = useRef(false);

  // Scroll observation for sticky-bottom detection
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const threshold = 50;
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
      setIsAtBottom(atBottom);

      // Load more when scrolled near top
      if (el.scrollTop < 100 && onLoadMore && !loadingMore.current) {
        loadingMore.current = true;
        const prevHeight = el.scrollHeight;
        Promise.resolve(onLoadMore()).finally(() => {
          // Restore scroll position after new items are added
          requestAnimationFrame(() => {
            const newHeight = el.scrollHeight;
            el.scrollTop = newHeight - prevHeight;
            loadingMore.current = false;
          });
        });
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [scrollRef, setIsAtBottom, onLoadMore]);

  // Auto-scroll to bottom when new messages arrive and already at bottom
  const prevLength = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevLength.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLength.current = messages.length;
  }, [messages.length]);

  return (
    <div
      ref={scrollRef}
      data-aui="thread-messages"
      className="aui-thread-messages"
      style={{ overflow: "auto", display: "flex", flexDirection: "column" }}
    >
      {messages.map((message, index) => (
        <Message key={message.id} message={message} index={index} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thread.Empty
// ---------------------------------------------------------------------------

export interface ThreadEmptyProps {
  children: ReactNode;
}

export function ThreadEmpty({ children }: ThreadEmptyProps) {
  const { messages, isLoading } = useThreadContext();
  if (messages.length > 0 || isLoading) return null;
  return (
    <div data-aui="thread-empty" className="aui-thread-empty">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thread.ScrollToBottom
// ---------------------------------------------------------------------------

export interface ThreadScrollToBottomProps {
  children?: ReactNode;
}

export function ThreadScrollToBottom({ children }: ThreadScrollToBottomProps) {
  const { isAtBottom, scrollToBottom } = useThreadContext();

  if (isAtBottom) return null;

  return (
    <button
      type="button"
      data-aui="thread-scroll-to-bottom"
      className="aui-thread-scroll-to-bottom"
      onClick={scrollToBottom}
    >
      {children ?? "↓"}
    </button>
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
