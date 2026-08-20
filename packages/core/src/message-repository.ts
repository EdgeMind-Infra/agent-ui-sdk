import type { UIMessage } from "ai";
import type { ExportedMessage, MessageNode } from "./types";

/**
 * Tree-based message repository that manages conversation branching.
 *
 * Messages are stored as a tree where each node can have multiple children
 * (branches). One branch per node is "active", forming the currently visible
 * conversation path from root to head.
 */
export class MessageRepository {
  private nodes = new Map<string, MessageNode>();
  private rootChildIds: string[] = [];
  private _headId: string | null = null;

  get headId(): string | null {
    return this._headId;
  }

  /**
   * Add a message to the tree, or update it if it already exists.
   * When adding, the message becomes a child of `parentId`.
   */
  addOrUpdateMessage(parentId: string | null, message: UIMessage): void {
    const existing = this.nodes.get(message.id);

    if (existing) {
      // Update in place — keep tree structure, replace message content
      existing.message = message;
      return;
    }

    const node: MessageNode = {
      message,
      parentId,
      childIds: [],
      activeBranchIndex: 0,
    };

    this.nodes.set(message.id, node);

    if (parentId === null) {
      this.rootChildIds.push(message.id);
      this._activeRootIndex = this.rootChildIds.length - 1;
    } else {
      const parent = this.nodes.get(parentId);
      if (parent) {
        parent.childIds.push(message.id);
        // New child becomes the active branch
        parent.activeBranchIndex = parent.childIds.length - 1;
      }
    }

    // Advance head to the newly added message
    this._headId = message.id;
  }

  /**
   * Get the linear message list for the currently active branch path.
   * Walks from root to head following each node's active branch.
   */
  getMessages(): UIMessage[] {
    const messages: UIMessage[] = [];
    const currentIds = this.rootChildIds;

    if (currentIds.length === 0) return messages;

    // Find the root entry point: walk up from head to find which root child is on the active path
    // Then walk down following activeBranchIndex
    const activePath = this.getActivePath();
    return activePath.map((id) => {
      const node = this.nodes.get(id);
      return node!.message;
    });
  }

  /**
   * Get all sibling branches for a given message (including itself).
   */
  getBranches(messageId: string): UIMessage[] {
    const node = this.nodes.get(messageId);
    if (!node) return [];

    const siblingIds =
      node.parentId === null ? this.rootChildIds : (this.nodes.get(node.parentId)?.childIds ?? []);

    return siblingIds.map((id) => this.nodes.get(id)!.message);
  }

  /**
   * How many sibling branches a message has (including itself).
   *
   * Message lists ask this per message per render just to decide whether a branch switcher is
   * needed, and the answer is 1 for nearly every message. Going through `getBranches()` for that
   * allocates a throwaway array each time; this returns a number instead.
   */
  getBranchCount(messageId: string): number {
    const node = this.nodes.get(messageId);
    if (!node) return 0;

    return node.parentId === null
      ? this.rootChildIds.length
      : (this.nodes.get(node.parentId)?.childIds.length ?? 0);
  }

  /**
   * Switch the active branch to the one containing `messageId`.
   * Updates the parent's activeBranchIndex and recomputes the head.
   */
  switchToBranch(messageId: string): void {
    const node = this.nodes.get(messageId);
    if (!node) return;

    if (node.parentId === null) {
      const index = this.rootChildIds.indexOf(messageId);
      if (index === -1) return;
      // For root children, we handle the "active root" via the path computation
      // We need a way to track active root — use a virtual approach:
      // Set all root siblings' parent activeBranchIndex conceptually
      // Actually, rootChildIds + activeBranchIndex on a virtual root
      this._activeRootIndex = index;
    } else {
      const parent = this.nodes.get(node.parentId);
      if (!parent) return;
      const index = parent.childIds.indexOf(messageId);
      if (index === -1) return;
      parent.activeBranchIndex = index;
    }

    // Recompute head: walk down from this node following active branches
    this._headId = this.findLeaf(messageId);
  }

  /**
   * Delete a message and all its descendants from the tree.
   */
  deleteMessage(messageId: string): void {
    const node = this.nodes.get(messageId);
    if (!node) return;

    // Recursively delete all descendants
    const deleteRecursive = (id: string) => {
      const n = this.nodes.get(id);
      if (!n) return;
      for (const childId of [...n.childIds]) {
        deleteRecursive(childId);
      }
      this.nodes.delete(id);
    };

    // Remove from parent's childIds
    if (node.parentId === null) {
      const index = this.rootChildIds.indexOf(messageId);
      if (index !== -1) {
        this.rootChildIds.splice(index, 1);
        if (this._activeRootIndex >= this.rootChildIds.length) {
          this._activeRootIndex = Math.max(0, this.rootChildIds.length - 1);
        }
      }
    } else {
      const parent = this.nodes.get(node.parentId);
      if (parent) {
        const index = parent.childIds.indexOf(messageId);
        if (index !== -1) {
          parent.childIds.splice(index, 1);
          if (parent.activeBranchIndex >= parent.childIds.length) {
            parent.activeBranchIndex = Math.max(0, parent.childIds.length - 1);
          }
        }
      }
    }

    deleteRecursive(messageId);

    // Recompute head
    if (this._headId === messageId || !this.nodes.has(this._headId ?? "")) {
      this.recomputeHead();
    }
  }

  /**
   * Reset the head pointer. Used when editing a message to truncate
   * everything after it.
   */
  resetHead(messageId: string | null): void {
    if (messageId === null) {
      this._headId = null;
      return;
    }
    if (this.nodes.has(messageId)) {
      this._headId = messageId;
    }
  }

  /**
   * Export the entire tree for persistence.
   * Returns messages in insertion order (Map iteration order).
   */
  export(): ExportedMessage[] {
    const result: ExportedMessage[] = [];
    for (const node of this.nodes.values()) {
      result.push({
        message: node.message,
        parentId: node.parentId,
      });
    }
    return result;
  }

  /**
   * Import messages from a persistence format, rebuilding the tree.
   * Clears any existing data first.
   */
  import(messages: ExportedMessage[]): void {
    this.nodes.clear();
    this.rootChildIds = [];
    this._headId = null;
    this._activeRootIndex = 0;

    for (const { message, parentId } of messages) {
      this.addOrUpdateMessage(parentId, message);
    }

    // After import, recompute head by following active path
    this.recomputeHead();
  }

  /**
   * Get a node by message ID.
   */
  getNode(messageId: string): MessageNode | undefined {
    return this.nodes.get(messageId);
  }

  /**
   * Get the total number of messages in the tree.
   */
  get size(): number {
    return this.nodes.size;
  }

  // --- Private helpers ---

  private _activeRootIndex = 0;

  /**
   * Get the active path from root to head as an array of message IDs.
   */
  private getActivePath(): string[] {
    if (this.rootChildIds.length === 0) return [];

    const path: string[] = [];
    const rootIndex = Math.min(this._activeRootIndex, this.rootChildIds.length - 1);
    let currentId: string | undefined = this.rootChildIds[rootIndex];

    while (currentId) {
      path.push(currentId);
      // Stop at head if set (used by resetHead to truncate)
      if (this._headId !== null && currentId === this._headId) break;
      const node = this.nodes.get(currentId);
      if (!node || node.childIds.length === 0) break;
      const branchIndex = Math.min(node.activeBranchIndex, node.childIds.length - 1);
      currentId = node.childIds[branchIndex];
    }

    return path;
  }

  /**
   * Find the deepest leaf following active branches from a starting node.
   */
  private findLeaf(messageId: string): string {
    let currentId = messageId;
    let node = this.nodes.get(currentId);

    while (node && node.childIds.length > 0) {
      const branchIndex = Math.min(node.activeBranchIndex, node.childIds.length - 1);
      currentId = node.childIds[branchIndex]!;
      node = this.nodes.get(currentId);
    }

    return currentId;
  }

  /**
   * Recompute head by following the active path from root.
   */
  private recomputeHead(): void {
    const path = this.getActivePath();
    this._headId = path.length > 0 ? (path[path.length - 1] ?? null) : null;
  }
}
