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
  favoriteThread(threadId: string): Promise<void>;
  unfavoriteThread(threadId: string): Promise<void>;
  setFilter(filter: ThreadFilterType): Promise<void>;
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
}

export function ThreadListProvider({ threadListAdapter, children }: ThreadListProviderProps) {
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

  const actions = useMemo<ThreadListActions>(
    () => ({
      createThread,
      switchThread,
      renameThread,
      deleteThread,
      favoriteThread,
      unfavoriteThread,
      setFilter,
    }),
    [
      createThread,
      switchThread,
      renameThread,
      deleteThread,
      favoriteThread,
      unfavoriteThread,
      setFilter,
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
