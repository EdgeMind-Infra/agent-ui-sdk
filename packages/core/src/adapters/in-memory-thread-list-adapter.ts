import type { ThreadListAdapter, ThreadMetadata } from "../types";

/**
 * In-memory implementation of ThreadListAdapter.
 * Useful for testing and prototyping. Data is lost on page refresh.
 */
export class InMemoryThreadListAdapter implements ThreadListAdapter {
  private store = new Map<string, ThreadMetadata>();
  private counter = 0;

  async list(): Promise<ThreadMetadata[]> {
    return [...this.store.values()]
      .filter((t) => !t.archived)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async create(metadata?: Partial<ThreadMetadata>): Promise<ThreadMetadata> {
    this.counter += 1;
    const now = new Date();
    const thread: ThreadMetadata = {
      id: metadata?.id ?? `thread-${this.counter}`,
      title: metadata?.title,
      createdAt: metadata?.createdAt ?? now,
      updatedAt: metadata?.updatedAt ?? now,
      archived: false,
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

  async archive(threadId: string): Promise<void> {
    const thread = this.store.get(threadId);
    if (thread) {
      thread.archived = true;
      thread.updatedAt = new Date();
    }
  }
}
