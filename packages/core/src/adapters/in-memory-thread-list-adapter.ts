import type { ThreadFilterType, ThreadListAdapter, ThreadMetadata } from "../types";

/**
 * In-memory implementation of ThreadListAdapter.
 * Useful for testing and prototyping. Data is lost on page refresh.
 */
export class InMemoryThreadListAdapter implements ThreadListAdapter {
  private store = new Map<string, ThreadMetadata>();
  private counter = 0;

  async list(filter?: ThreadFilterType): Promise<ThreadMetadata[]> {
    let threads = [...this.store.values()].sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    );
    if (filter === "favorited") {
      threads = threads.filter((t) => t.favorited);
    }
    return threads;
  }

  async create(metadata?: Partial<ThreadMetadata>): Promise<ThreadMetadata> {
    this.counter += 1;
    const now = new Date();
    const thread: ThreadMetadata = {
      id: metadata?.id ?? `thread-${this.counter}`,
      title: metadata?.title,
      createdAt: metadata?.createdAt ?? now,
      updatedAt: metadata?.updatedAt ?? now,
      favorited: metadata?.favorited ?? false,
    };
    this.store.set(thread.id, thread);
    return thread;
  }

  async rename(threadId: string, title: string): Promise<void> {
    const thread = this.store.get(threadId);
    if (thread) {
      thread.title = title;
      thread.updatedAt = new Date();
    }
  }

  async delete(threadId: string): Promise<void> {
    this.store.delete(threadId);
  }

  async favorite(threadId: string): Promise<void> {
    const thread = this.store.get(threadId);
    if (thread) {
      thread.favorited = true;
      thread.updatedAt = new Date();
    }
  }

  async unfavorite(threadId: string): Promise<void> {
    const thread = this.store.get(threadId);
    if (thread) {
      thread.favorited = false;
      thread.updatedAt = new Date();
    }
  }
}
