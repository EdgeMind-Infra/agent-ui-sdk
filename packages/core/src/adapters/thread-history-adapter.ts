import type { UIMessage } from "ai";

/**
 * ThreadHistoryAdapter — pluggable interface for persisting a single thread's messages.
 *
 * Implementations can back this with any storage (localStorage, IndexedDB, REST API, etc.).
 * The SDK calls `load()` on mount and `append()` when a run finishes.
 */
export interface ThreadHistoryAdapter {
  /** Load persisted messages for a thread. Returns empty array if no history exists. */
  load(threadId: string): Promise<{ messages: UIMessage[]; unstable_resume?: boolean }>;

  /** Append a message to the thread's persisted history. */
  append(threadId: string, message: UIMessage, options?: { isDisconnect?: boolean }): Promise<void>;
}
