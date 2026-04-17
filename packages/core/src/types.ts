import type { UIMessage } from "ai";

/**
 * A node in the message tree structure.
 */
export interface MessageNode {
  message: UIMessage;
  parentId: string | null;
  childIds: string[];
  /** Index of the currently active child branch. */
  activeBranchIndex: number;
}

/**
 * Serializable format for persistence.
 */
export interface ExportedMessage {
  message: UIMessage;
  parentId: string | null;
}

/**
 * Metadata for a conversation thread.
 */
export interface ThreadMetadata {
  id: string;
  title?: string;
  createdAt: Date;
  updatedAt: Date;
  favorited?: boolean;
  extra?: Record<string, unknown>;
}

/**
 * Adapter for persisting thread message history.
 */
export interface ThreadHistoryAdapter {
  load(threadId: string): Promise<ExportedMessage[]>;
  append(threadId: string, messages: ExportedMessage[]): Promise<void>;
  save(threadId: string, messages: ExportedMessage[]): Promise<void>;
}

/**
 * Filter type for thread list queries.
 * "all" returns everything; other values filter by the corresponding property.
 */
export type ThreadFilterType = "all" | "favorited";

/**
 * Adapter for managing the list of threads.
 */
export interface ThreadListAdapter {
  list(filter?: ThreadFilterType): Promise<ThreadMetadata[]>;
  create(metadata?: Partial<ThreadMetadata>): Promise<ThreadMetadata>;
  rename(threadId: string, title: string): Promise<void>;
  delete(threadId: string): Promise<void>;
  favorite(threadId: string): Promise<void>;
  unfavorite(threadId: string): Promise<void>;
  update?(threadId: string, patch: Partial<ThreadMetadata>): Promise<void>;
}
