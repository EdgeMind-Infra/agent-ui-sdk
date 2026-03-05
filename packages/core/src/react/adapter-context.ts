import { createContext, useContext } from "react";
import type { ThreadHistoryAdapter } from "../adapters/thread-history-adapter";
import type { ThreadListAdapter } from "../adapters/thread-list-adapter";

export const HistoryAdapterContext = createContext<ThreadHistoryAdapter | null>(null);

export const ThreadListAdapterContext = createContext<ThreadListAdapter | null>(null);

export const ThreadIdContext = createContext<string | undefined>(undefined);

/** Read the ThreadHistoryAdapter from context (null if not provided) */
export function useHistoryAdapterContext(): ThreadHistoryAdapter | null {
  return useContext(HistoryAdapterContext);
}

/** Read the ThreadListAdapter from context (null if not provided) */
export function useThreadListAdapterContext(): ThreadListAdapter | null {
  return useContext(ThreadListAdapterContext);
}

/** Read the threadId prop from context */
export function useThreadIdContext(): string | undefined {
  return useContext(ThreadIdContext);
}
