import type { ThreadFilterType, ThreadListAdapter, ThreadMetadata } from "../types";
import { LocalStorageHistoryAdapter } from "./local-storage-history-adapter";

export interface LocalStorageThreadListAdapterOptions {
  /** Storage key prefix. Default: "edgemind" */
  prefix?: string;
}

/**
 * Serializable shape for ThreadMetadata in localStorage.
 * Dates are stored as ISO strings.
 */
interface StoredThreadMetadata {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  favorited?: boolean;
}

function toStored(t: ThreadMetadata): StoredThreadMetadata {
  return {
    id: t.id,
    title: t.title,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    favorited: t.favorited,
  };
}

function fromStored(s: StoredThreadMetadata): ThreadMetadata {
  return {
    id: s.id,
    title: s.title,
    createdAt: new Date(s.createdAt),
    updatedAt: new Date(s.updatedAt),
    favorited: s.favorited,
  };
}

let idCounter = 0;

function generateId(): string {
  idCounter += 1;
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${ts}-${rand}-${idCounter}`;
}

/**
 * localStorage implementation of ThreadListAdapter.
 * Thread list is stored under `{prefix}:threads`.
 * Deleting a thread also removes its messages via LocalStorageHistoryAdapter.
 */
export class LocalStorageThreadListAdapter implements ThreadListAdapter {
  private prefix: string;
  private historyAdapter: LocalStorageHistoryAdapter;

  constructor(options?: LocalStorageThreadListAdapterOptions) {
    this.prefix = options?.prefix ?? "edgemind";
    this.historyAdapter = new LocalStorageHistoryAdapter({ prefix: this.prefix });
  }

  private get storageKey(): string {
    return `${this.prefix}:threads`;
  }

  private readThreads(): ThreadMetadata[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const stored = JSON.parse(raw) as StoredThreadMetadata[];
      return stored.map(fromStored);
    } catch (e) {
      console.warn("[LocalStorageThreadListAdapter] Failed to parse thread list:", e);
      return [];
    }
  }

  private writeThreads(threads: ThreadMetadata[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(threads.map(toStored)));
  }

  private findThread(threadId: string): { threads: ThreadMetadata[]; index: number } | null {
    const threads = this.readThreads();
    const index = threads.findIndex((t) => t.id === threadId);
    if (index === -1) return null;
    return { threads, index };
  }

  async list(filter?: ThreadFilterType): Promise<ThreadMetadata[]> {
    let threads = this.readThreads().sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
    if (filter === "favorited") {
      threads = threads.filter((t) => t.favorited);
    }
    return threads;
  }

  async create(metadata?: Partial<ThreadMetadata>): Promise<ThreadMetadata> {
    const now = new Date();
    const thread: ThreadMetadata = {
      id: metadata?.id ?? generateId(),
      title: metadata?.title,
      createdAt: metadata?.createdAt ?? now,
      updatedAt: metadata?.updatedAt ?? now,
      favorited: metadata?.favorited ?? false,
    };
    const threads = this.readThreads();
    threads.push(thread);
    this.writeThreads(threads);
    return thread;
  }

  async rename(threadId: string, title: string): Promise<void> {
    const result = this.findThread(threadId);
    if (!result) return;
    const { threads, index } = result;
    threads[index]!.title = title;
    threads[index]!.updatedAt = new Date();
    this.writeThreads(threads);
  }

  async delete(threadId: string): Promise<void> {
    const threads = this.readThreads().filter((t) => t.id !== threadId);
    this.writeThreads(threads);
    this.historyAdapter.removeThread(threadId);
  }

  async favorite(threadId: string): Promise<void> {
    const result = this.findThread(threadId);
    if (!result) return;
    const { threads, index } = result;
    threads[index]!.favorited = true;
    threads[index]!.updatedAt = new Date();
    this.writeThreads(threads);
  }

  async unfavorite(threadId: string): Promise<void> {
    const result = this.findThread(threadId);
    if (!result) return;
    const { threads, index } = result;
    threads[index]!.favorited = false;
    threads[index]!.updatedAt = new Date();
    this.writeThreads(threads);
  }
}
