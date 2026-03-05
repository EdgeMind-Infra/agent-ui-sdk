/**
 * ThreadListAdapter — pluggable interface for managing multiple threads.
 *
 * All methods are optional; adapter implementations can provide a subset.
 * Operations not supported by the adapter are silently skipped by useThreadList.
 */

export interface ThreadMetadata {
  id: string;
  title?: string;
  status: "active" | "archived";
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ThreadListAdapter {
  list?(): Promise<ThreadMetadata[]>;
  create?(options?: { title?: string }): Promise<ThreadMetadata>;
  rename?(threadId: string, title: string): Promise<void>;
  delete?(threadId: string): Promise<void>;
  archive?(threadId: string): Promise<void>;
  unarchive?(threadId: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// InMemoryThreadListAdapter — built-in in-memory implementation
// ---------------------------------------------------------------------------

export interface InMemoryThreadListAdapterOptions {
  initialThreads?: ThreadMetadata[];
}

let nextId = 1;

export class InMemoryThreadListAdapter implements Required<ThreadListAdapter> {
  private threads: ThreadMetadata[];

  constructor(options: InMemoryThreadListAdapterOptions = {}) {
    this.threads = options.initialThreads ? [...options.initialThreads] : [];
  }

  async list(): Promise<ThreadMetadata[]> {
    return [...this.threads];
  }

  async create(options?: { title?: string }): Promise<ThreadMetadata> {
    const now = new Date();
    const thread: ThreadMetadata = {
      id: `thread_${Date.now()}_${nextId++}`,
      title: options?.title,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };
    this.threads.unshift(thread);
    return thread;
  }

  async rename(threadId: string, title: string): Promise<void> {
    const thread = this.threads.find((t) => t.id === threadId);
    if (thread) {
      thread.title = title;
      thread.updatedAt = new Date();
    }
  }

  async delete(threadId: string): Promise<void> {
    this.threads = this.threads.filter((t) => t.id !== threadId);
  }

  async archive(threadId: string): Promise<void> {
    const thread = this.threads.find((t) => t.id === threadId);
    if (thread) {
      thread.status = "archived";
      thread.updatedAt = new Date();
    }
  }

  async unarchive(threadId: string): Promise<void> {
    const thread = this.threads.find((t) => t.id === threadId);
    if (thread) {
      thread.status = "active";
      thread.updatedAt = new Date();
    }
  }
}
