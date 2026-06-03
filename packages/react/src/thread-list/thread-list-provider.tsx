"use client";

import type { ThreadFilterType, ThreadListAdapter, ThreadMetadata } from "@agent-ui-sdk/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ===== State shape (kept for backward-compat with consumers importing it) =====

export interface ThreadListState {
  threads: ThreadMetadata[];
  activeThreadId: string | null;
  isLoading: boolean;
  activeFilter: ThreadFilterType;
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

// ===== React Query keys =====

const THREAD_LIST_KEY = "agent-ui-sdk:thread-list";
/** 所有 filter 共享前缀,便于一次性 invalidate 全部视图。 */
const threadListKey = (filter: ThreadFilterType) => [THREAD_LIST_KEY, filter] as const;

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

/**
 * Thread list state — backed by React Query.
 *
 * 列表数据走 useQuery(轮询 / focus 刷新 / 缓存 / dedup 全由 RQ 负责);本地仅保留
 * 两个 UI 状态:`activeFilter`(查询 key)与 `activeThreadId`(当前激活的会话)。
 * 变更操作通过 setQueryData 乐观更新或 invalidate 重拉。对外 `useThreadList()` 接口
 * 与行为保持不变。共用消费方的 QueryClient,因此缓存与 app 的 React Query 一致。
 */
export function ThreadListProvider({
  threadListAdapter,
  children,
  refetchInterval,
  refetchOnWindowFocus = true,
  enableBroadcastChannel = false,
}: ThreadListProviderProps) {
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<ThreadFilterType>("all");
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: threadListKey(activeFilter),
    queryFn: () => threadListAdapter.list(activeFilter),
    refetchInterval: refetchInterval && refetchInterval > 0 ? refetchInterval : false,
    refetchOnWindowFocus,
    // refetchIntervalInBackground 默认 false → RQ 在窗口失焦时自动暂停轮询。
  });

  const threads = useMemo(() => query.data ?? [], [query.data]);

  // 首次加载后默认激活最近的会话(保留旧 provider 行为);仅在尚未有激活项时生效一次。
  const didAutoSelect = useRef(false);
  useEffect(() => {
    if (didAutoSelect.current) return;
    if (activeThreadId !== null) {
      didAutoSelect.current = true;
      return;
    }
    if (threads.length > 0) {
      setActiveThreadId(threads[0]!.id);
      didAutoSelect.current = true;
    }
  }, [threads, activeThreadId]);

  /** 直接改当前 filter 缓存(乐观/本地更新)。 */
  const patchCurrent = useCallback(
    (updater: (prev: ThreadMetadata[]) => ThreadMetadata[]) => {
      queryClient.setQueryData<ThreadMetadata[]>(threadListKey(activeFilter), (prev) =>
        updater(prev ?? []),
      );
    },
    [queryClient, activeFilter],
  );

  const refreshThreadList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: [THREAD_LIST_KEY] });
  }, [queryClient]);

  const createThread = useCallback(
    async (metadata?: Partial<ThreadMetadata>) => {
      const thread = await threadListAdapter.create(metadata);
      // 取消所有 filter 在途 refetch:若有一个在 create 之前发出、之后才 resolve 的列表
      // 拉取,它会用(尚不含新会话的)旧服务端列表整体覆盖下面的乐观插入,导致新会话瞬间
      // 消失。cancelQueries 默认 revert:true,abort 在途请求使其不再回填(RQ 官方乐观做法)。
      await queryClient.cancelQueries({ queryKey: [THREAD_LIST_KEY] });
      // 乐观置顶(等价旧 ADD_THREAD)+ 激活;adapter.create 已保证 updatedAt=now。
      patchCurrent((prev) => [thread, ...prev.filter((t) => t.id !== thread.id)]);
      setActiveThreadId(thread.id);
      return thread;
    },
    [threadListAdapter, patchCurrent, queryClient],
  );

  const switchThread = useCallback((threadId: string) => {
    setActiveThreadId(threadId);
  }, []);

  const renameThread = useCallback(
    async (threadId: string, title: string) => {
      await threadListAdapter.rename(threadId, title);
      patchCurrent((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, title, updatedAt: new Date() } : t)),
      );
    },
    [threadListAdapter, patchCurrent],
  );

  const deleteThread = useCallback(
    async (threadId: string) => {
      await threadListAdapter.delete(threadId);
      const next = (
        queryClient.getQueryData<ThreadMetadata[]>(threadListKey(activeFilter)) ?? []
      ).filter((t) => t.id !== threadId);
      queryClient.setQueryData(threadListKey(activeFilter), next);
      // 删除的是当前激活会话时,切到列表第一个(等价旧 REMOVE_THREAD)。
      setActiveThreadId((cur) => (cur === threadId ? (next[0]?.id ?? null) : cur));
    },
    [threadListAdapter, queryClient, activeFilter],
  );

  const updateThread = useCallback(
    (threadId: string, updates: Partial<ThreadMetadata>) => {
      patchCurrent((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, ...updates, updatedAt: new Date() } : t)),
      );
    },
    [patchCurrent],
  );

  const favoriteThread = useCallback(
    async (threadId: string) => {
      await threadListAdapter.favorite(threadId);
      // 收藏可能影响多个视图(如 favorited),失效全部 filter 让其重拉。
      await queryClient.invalidateQueries({ queryKey: [THREAD_LIST_KEY] });
    },
    [threadListAdapter, queryClient],
  );

  const unfavoriteThread = useCallback(
    async (threadId: string) => {
      await threadListAdapter.unfavorite(threadId);
      await queryClient.invalidateQueries({ queryKey: [THREAD_LIST_KEY] });
    },
    [threadListAdapter, queryClient],
  );

  const setFilter = useCallback(async (filter: ThreadFilterType) => {
    // 切 filter 即换 query key → RQ 自动拉取(有缓存先显缓存再后台刷新)。
    setActiveFilter(filter);
  }, []);

  // 跨标签页刷新:settings 页(可能在另一个 tab)触发 runNow 后广播,主应用立即失效重拉。
  useEffect(() => {
    if (!enableBroadcastChannel || typeof BroadcastChannel === "undefined") return;
    const bc = new BroadcastChannel("task-list");
    const onMessage = (event: MessageEvent) => {
      if (event.data && typeof event.data === "object" && event.data.type === "refresh") {
        void queryClient.invalidateQueries({ queryKey: [THREAD_LIST_KEY] });
      }
    };
    bc.addEventListener("message", onMessage);
    return () => {
      bc.removeEventListener("message", onMessage);
      bc.close();
    };
  }, [enableBroadcastChannel, queryClient]);

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
      threads,
      activeThreadId,
      isLoading: query.isLoading,
      activeFilter,
      actions,
    }),
    [threads, activeThreadId, query.isLoading, activeFilter, actions],
  );

  return <ThreadListContext value={value}>{children}</ThreadListContext>;
}
