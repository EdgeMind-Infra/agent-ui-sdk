import type { ExportedMessage, ThreadHistoryAdapter } from "../types";

/**
 * In-memory implementation of ThreadHistoryAdapter.
 * Useful for testing and prototyping. Data is lost on page refresh.
 */
export class InMemoryHistoryAdapter implements ThreadHistoryAdapter {
  private store = new Map<string, ExportedMessage[]>();

  async load(threadId: string): Promise<ExportedMessage[]> {
    return this.store.get(threadId) ?? [];
  }

  async append(threadId: string, messages: ExportedMessage[]): Promise<void> {
    const existing = this.store.get(threadId) ?? [];
    this.store.set(threadId, [...existing, ...messages]);
  }

  async save(threadId: string, messages: ExportedMessage[]): Promise<void> {
    this.store.set(threadId, messages);
  }
}
