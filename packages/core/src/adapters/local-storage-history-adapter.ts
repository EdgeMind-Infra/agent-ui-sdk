import type { ExportedMessage, ThreadHistoryAdapter } from "../types";

export interface LocalStorageHistoryAdapterOptions {
  /** Storage key prefix. Default: "edgemind" */
  prefix?: string;
}

/**
 * localStorage implementation of ThreadHistoryAdapter.
 * Messages are stored under `{prefix}:thread:{threadId}`.
 */
export class LocalStorageHistoryAdapter implements ThreadHistoryAdapter {
  private prefix: string;

  constructor(options?: LocalStorageHistoryAdapterOptions) {
    this.prefix = options?.prefix ?? "edgemind";
  }

  private key(threadId: string): string {
    return `${this.prefix}:thread:${threadId}`;
  }

  private readMessages(threadId: string): ExportedMessage[] {
    try {
      const raw = localStorage.getItem(this.key(threadId));
      if (!raw) return [];
      return JSON.parse(raw) as ExportedMessage[];
    } catch (e) {
      console.warn(
        `[LocalStorageHistoryAdapter] Failed to parse messages for thread ${threadId}:`,
        e,
      );
      return [];
    }
  }

  private writeMessages(threadId: string, messages: ExportedMessage[]): void {
    localStorage.setItem(this.key(threadId), JSON.stringify(messages));
  }

  async load(threadId: string): Promise<ExportedMessage[]> {
    return this.readMessages(threadId);
  }

  async append(threadId: string, messages: ExportedMessage[]): Promise<void> {
    const existing = this.readMessages(threadId);
    this.writeMessages(threadId, [...existing, ...messages]);
  }

  async save(threadId: string, messages: ExportedMessage[]): Promise<void> {
    this.writeMessages(threadId, messages);
  }

  /** Remove stored messages for a thread. Called when a thread is deleted. */
  removeThread(threadId: string): void {
    localStorage.removeItem(this.key(threadId));
  }
}
