import { useCallback, useEffect, useState } from "react";
import type { ThreadMetadata } from "../../adapters/thread-list-adapter";
import { useThreadListAdapterContext } from "../adapter-context";
import { useAgentUIStoreApi } from "../provider";

export interface UseThreadListReturn {
  /** Current list of threads */
  threads: ThreadMetadata[];
  /** Whether the thread list is loading */
  isLoading: boolean;
  /** Switch to a different thread */
  switchThread: (threadId: string) => void;
  /** Create a new thread and switch to it */
  createThread: (options?: { title?: string }) => Promise<ThreadMetadata | undefined>;
  /** Delete a thread */
  deleteThread: (threadId: string) => Promise<void>;
  /** Rename a thread */
  renameThread: (threadId: string, title: string) => Promise<void>;
  /** Archive a thread */
  archiveThread: (threadId: string) => Promise<void>;
}

/**
 * useThreadList — manages multi-thread UI state.
 *
 * Reads the ThreadListAdapter from context. No-op if adapter is not provided.
 */
export function useThreadList(): UseThreadListReturn {
  const adapter = useThreadListAdapterContext();
  const store = useAgentUIStoreApi();
  const [threads, setThreads] = useState<ThreadMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load thread list on mount
  useEffect(() => {
    if (!adapter?.list) return;
    setIsLoading(true);
    adapter.list().then(
      (list) => {
        setThreads(list);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
      },
    );
  }, [adapter]);

  const switchThread = useCallback(
    (threadId: string) => {
      store.getState().setCurrentThreadId(threadId);
    },
    [store],
  );

  const createThread = useCallback(
    async (options?: { title?: string }): Promise<ThreadMetadata | undefined> => {
      if (!adapter?.create) return undefined;
      const thread = await adapter.create(options);
      setThreads((prev) => [thread, ...prev]);
      switchThread(thread.id);
      return thread;
    },
    [adapter, switchThread],
  );

  const deleteThread = useCallback(
    async (threadId: string): Promise<void> => {
      if (!adapter?.delete) return;
      await adapter.delete(threadId);
      setThreads((prev) => {
        const updated = prev.filter((t) => t.id !== threadId);
        // If deleted thread was the current one, switch to next available
        const currentId = store.getState().currentThreadId;
        if (currentId === threadId) {
          const next = updated.find((t) => t.status === "active");
          store.getState().setCurrentThreadId(next?.id);
        }
        return updated;
      });
    },
    [adapter, store],
  );

  const renameThread = useCallback(
    async (threadId: string, title: string): Promise<void> => {
      if (!adapter?.rename) return;
      await adapter.rename(threadId, title);
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, title, updatedAt: new Date() } : t)),
      );
    },
    [adapter],
  );

  const archiveThread = useCallback(
    async (threadId: string): Promise<void> => {
      if (!adapter?.archive) return;
      await adapter.archive(threadId);
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, status: "archived" as const, updatedAt: new Date() } : t,
        ),
      );
    },
    [adapter],
  );

  return {
    threads,
    isLoading,
    switchThread,
    createThread,
    deleteThread,
    renameThread,
    archiveThread,
  };
}
