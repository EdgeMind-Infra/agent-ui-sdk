"use client";

import type { ThreadFilterType, ThreadListAdapter, ThreadMetadata } from "@agent-ui-sdk/core";
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
} from "react";

// ===== State & Actions =====

export interface ThreadListState {
  threads: ThreadMetadata[];
  activeThreadId: string | null;
  isLoading: boolean;
  activeFilter: ThreadFilterType;
}

type ThreadListAction =
  | { type: "SET_THREADS"; threads: ThreadMetadata[] }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "SET_ACTIVE"; threadId: string | null }
  | { type: "SET_FILTER"; filter: ThreadFilterType }
  | { type: "ADD_THREAD"; thread: ThreadMetadata }
  | { type: "UPDATE_THREAD"; threadId: string; updates: Partial<ThreadMetadata> }
  | { type: "REMOVE_THREAD"; threadId: string };

function threadListReducer(state: ThreadListState, action: ThreadListAction): ThreadListState {
  switch (action.type) {
    case "SET_THREADS":
      return { ...state, threads: action.threads, isLoading: false };
    case "SET_LOADING":
      return { ...state, isLoading: action.isLoading };
    case "SET_ACTIVE":
      return { ...state, activeThreadId: action.threadId };
    case "SET_FILTER":
      return { ...state, activeFilter: action.filter };
    case "ADD_THREAD":
      return {
        ...state,
        threads: [action.thread, ...state.threads],
        activeThreadId: action.thread.id,
      };
    case "UPDATE_THREAD":
      return {
        ...state,
        threads: state.threads.map((t) =>
          t.id === action.threadId ? { ...t, ...action.updates, updatedAt: new Date() } : t,
        ),
      };
    case "REMOVE_THREAD": {
      const filtered = state.threads.filter((t) => t.id !== action.threadId);
      const needSwitch = state.activeThreadId === action.threadId;
      return {
        ...state,
        threads: filtered,
        activeThreadId: needSwitch ? (filtered[0]?.id ?? null) : state.activeThreadId,
      };
    }
    default:
      return state;
  }
}

// ===== Actions interface =====

export interface ThreadListActions {
  createThread(metadata?: Partial<ThreadMetadata>): Promise<ThreadMetadata>;
  switchThread(threadId: string): void;
  renameThread(threadId: string, title: string): Promise<void>;
  deleteThread(threadId: string): Promise<void>;
  updateThread(threadId: string, updates: Partial<ThreadMetadata>): void;
  favoriteThread(threadId: string): Promise<void>;
  unfavoriteThread(threadId: string): Promise<void>;
  setFilter(filter: ThreadFilterType): Promise<void>;
  /**
   * Re-fetch the thread list under the current filter. Intended for external
   * triggers such as "立即运行" on a scheduled task so the sidebar reflects
   * freshly created tasks without waiting for the polling interval.
   */
  refreshThreadList(): Promise<void>;
}

// ===== Context =====

export interface ThreadListContextValue {
  threads: ThreadMetadata[];
  activeThreadId: string | null;
  isLoading: boolean;
  activeFilter: ThreadFilterType;
  actions: ThreadListActions;
}

const ThreadListContext = createContext<ThreadListContextValue | null>(null);

// ===== Hook =====

export function useThreadList(): ThreadListContextValue {
  const ctx = use(ThreadListContext);
  if (!ctx) {
    throw new Error("useThreadList must be used within a <ThreadListProvider>");
  }
  return ctx;
}

// ===== Provider =====

export interface ThreadListProviderProps {
  threadListAdapter: ThreadListAdapter;
  children: ReactNode;
  /**
   * Milliseconds between background refreshes of the thread list. Default
   * undefined = disabled. Setting ~60000 is a reasonable floor for catching
   * cron-triggered scheduled tasks without hammering the API.
   */
  refetchInterval?: number;
  /**
   * When true, refresh on window focus. Catches the common case where a user
   * tabs away, a cron fires, and they come back expecting fresh state.
   * Default true.
   */
  refetchOnWindowFocus?: boolean;
  /**
   * When true, listen on a `BroadcastChannel('task-list')` for `{type:
   * 'refresh'}` messages. Lets the settings page (in a different tab) nudge
   * the main app to refresh after `runNow`, without plumbing through a
   * server-side push channel.
   */
  enableBroadcastChannel?: boolean;
}

export function ThreadListProvider({
  threadListAdapter,
  children,
  refetchInterval,
  refetchOnWindowFocus = true,
  enableBroadcastChannel = false,
}: ThreadListProviderProps) {
  const [state, dispatch] = useReducer(threadListReducer, {
    threads: [],
    activeThreadId: null,
    isLoading: true,
    activeFilter: "all",
  });

  // Load thread list on mount
  useEffect(() => {
    let cancelled = false;
    threadListAdapter.list().then((threads) => {
      if (cancelled) return;
      dispatch({ type: "SET_THREADS", threads });
      // Auto-select most recent thread
      if (threads.length > 0) {
        dispatch({ type: "SET_ACTIVE", threadId: threads[0]!.id });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [threadListAdapter]);

  const createThread = useCallback(
    async (metadata?: Partial<ThreadMetadata>) => {
      const thread = await threadListAdapter.create(metadata);
      dispatch({ type: "ADD_THREAD", thread });
      return thread;
    },
    [threadListAdapter],
  );

  const switchThread = useCallback((threadId: string) => {
    dispatch({ type: "SET_ACTIVE", threadId });
  }, []);

  const renameThread = useCallback(
    async (threadId: string, title: string) => {
      await threadListAdapter.rename(threadId, title);
      dispatch({ type: "UPDATE_THREAD", threadId, updates: { title } });
    },
    [threadListAdapter],
  );

  const deleteThread = useCallback(
    async (threadId: string) => {
      await threadListAdapter.delete(threadId);
      dispatch({ type: "REMOVE_THREAD", threadId });
    },
    [threadListAdapter],
  );

  const updateThread = useCallback((threadId: string, updates: Partial<ThreadMetadata>) => {
    dispatch({ type: "UPDATE_THREAD", threadId, updates });
  }, []);

  const favoriteThread = useCallback(
    async (threadId: string) => {
      await threadListAdapter.favorite(threadId);
      // Re-fetch with active filter to keep list consistent
      const threads = await threadListAdapter.list(state.activeFilter);
      dispatch({ type: "SET_THREADS", threads });
    },
    [threadListAdapter, state.activeFilter],
  );

  const unfavoriteThread = useCallback(
    async (threadId: string) => {
      await threadListAdapter.unfavorite(threadId);
      // Re-fetch with active filter (e.g., unfavoriting while in "favorited" view removes it)
      const threads = await threadListAdapter.list(state.activeFilter);
      dispatch({ type: "SET_THREADS", threads });
    },
    [threadListAdapter, state.activeFilter],
  );

  const setFilter = useCallback(
    async (filter: ThreadFilterType) => {
      dispatch({ type: "SET_FILTER", filter });
      dispatch({ type: "SET_LOADING", isLoading: true });
      const threads = await threadListAdapter.list(filter);
      dispatch({ type: "SET_THREADS", threads });
    },
    [threadListAdapter],
  );

  const refreshThreadList = useCallback(async () => {
    const threads = await threadListAdapter.list(state.activeFilter);
    dispatch({ type: "SET_THREADS", threads });
  }, [threadListAdapter, state.activeFilter]);

  // Background polling. Paused when the document is hidden so idle tabs
  // don't burn requests; resumes automatically on visibilitychange.
  useEffect(() => {
    if (!refetchInterval || refetchInterval <= 0) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => {
        void refreshThreadList();
      }, refetchInterval);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      start();
    }
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }
    return () => {
      stop();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
  }, [refetchInterval, refreshThreadList]);

  // Refresh on window focus — catches cron-triggered tasks while the user
  // was away. Separate from polling so each setting can be toggled alone.
  useEffect(() => {
    if (!refetchOnWindowFocus || typeof window === "undefined") return;
    const onFocus = () => {
      void refreshThreadList();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetchOnWindowFocus, refreshThreadList]);

  // Cross-tab refresh via BroadcastChannel. Useful when the settings page
  // (possibly opened in another tab) triggers `runNow` — it broadcasts and
  // the main app refreshes without waiting for its polling cycle.
  useEffect(() => {
    if (!enableBroadcastChannel || typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel("task-list");
    const onMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === "object" && event.data.type === "refresh") {
        void refreshThreadList();
      }
    };
    bc.addEventListener("message", onMessage);
    return () => {
      bc.removeEventListener("message", onMessage);
      bc.close();
    };
  }, [enableBroadcastChannel, refreshThreadList]);

  const actions = useMemo<ThreadListActions>(
    () => ({
      createThread,
      switchThread,
      renameThread,
      deleteThread,
      updateThread,
      favoriteThread,
      unfavoriteThread,
      setFilter,
      refreshThreadList,
    }),
    [
      createThread,
      switchThread,
      renameThread,
      deleteThread,
      updateThread,
      favoriteThread,
      unfavoriteThread,
      setFilter,
      refreshThreadList,
    ],
  );

  const value = useMemo<ThreadListContextValue>(
    () => ({
      threads: state.threads,
      activeThreadId: state.activeThreadId,
      isLoading: state.isLoading,
      activeFilter: state.activeFilter,
      actions,
    }),
    [state.threads, state.activeThreadId, state.isLoading, state.activeFilter, actions],
  );

  return <ThreadListContext value={value}>{children}</ThreadListContext>;
}
