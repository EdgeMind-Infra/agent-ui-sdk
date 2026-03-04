/**
 * MessageRepository — A branch-aware message tree.
 *
 * Inspired by assistant-ui's MessageRepository pattern.
 * Provides ChatGPT-like edit/regenerate with branch navigation.
 *
 * Architecture:
 *   Message A → Message B → Message C (branch 0)
 *                         ↘ Message D (branch 1)
 *
 * Each message can have multiple children (branches).
 * The repository tracks which branch is "active" at each node.
 */

import type { BaseMessage } from "./types";

/** A node in the message tree */
export interface MessageNode {
  message: BaseMessage;
  parentId: string | null;
  childIds: string[];
  /** Index of the currently active child branch */
  activeBranchIndex: number;
}

/** Branch navigation state for a message */
export interface BranchState {
  branchIndex: number;
  branchCount: number;
}

export class MessageRepository {
  private nodes = new Map<string, MessageNode>();
  private rootIds: string[] = [];
  private activeRootIndex = 0;

  /** Add or update a message in the tree */
  addOrUpdateMessage(message: BaseMessage, parentId: string | null): void {
    const existing = this.nodes.get(message.id);

    if (existing) {
      // Update existing message content
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
      this.rootIds.push(message.id);
      this.activeRootIndex = this.rootIds.length - 1;
    } else {
      const parent = this.nodes.get(parentId);
      if (parent) {
        parent.childIds.push(message.id);
        // Switch to the new branch
        parent.activeBranchIndex = parent.childIds.length - 1;
      }
    }
  }

  /** Get the linear active message thread (following active branches) */
  getMessages(): BaseMessage[] {
    const messages: BaseMessage[] = [];

    if (this.rootIds.length === 0) return messages;

    let currentId: string | undefined = this.rootIds[this.activeRootIndex];

    while (currentId) {
      const node = this.nodes.get(currentId);
      if (!node) break;

      messages.push(node.message);

      if (node.childIds.length === 0) break;
      currentId = node.childIds[node.activeBranchIndex];
    }

    return messages;
  }

  /** Get branch state for a given message */
  getBranches(messageId: string): BranchState | null {
    const node = this.nodes.get(messageId);
    if (!node) return null;

    if (node.parentId === null) {
      // Root-level branching
      const index = this.rootIds.indexOf(messageId);
      return { branchIndex: index, branchCount: this.rootIds.length };
    }

    const parent = this.nodes.get(node.parentId);
    if (!parent) return null;

    const index = parent.childIds.indexOf(messageId);
    return { branchIndex: index, branchCount: parent.childIds.length };
  }

  /** Switch to a specific branch at a message's parent */
  switchToBranch(messageId: string, branchIndex: number): void {
    const node = this.nodes.get(messageId);
    if (!node) return;

    if (node.parentId === null) {
      if (branchIndex >= 0 && branchIndex < this.rootIds.length) {
        this.activeRootIndex = branchIndex;
      }
      return;
    }

    const parent = this.nodes.get(node.parentId);
    if (!parent) return;

    if (branchIndex >= 0 && branchIndex < parent.childIds.length) {
      parent.activeBranchIndex = branchIndex;
    }
  }

  /** Reset: truncate messages after a given message ID (for edit/regenerate) */
  resetHead(messageId: string): void {
    const node = this.nodes.get(messageId);
    if (!node) return;

    // Remove all children recursively
    const removeChildren = (id: string) => {
      const n = this.nodes.get(id);
      if (!n) return;
      for (const childId of n.childIds) {
        removeChildren(childId);
        this.nodes.delete(childId);
      }
      n.childIds = [];
      n.activeBranchIndex = 0;
    };

    removeChildren(messageId);
  }

  /** Get a specific message node */
  getNode(messageId: string): MessageNode | undefined {
    return this.nodes.get(messageId);
  }

  /** Clear all messages */
  clear(): void {
    this.nodes.clear();
    this.rootIds = [];
    this.activeRootIndex = 0;
  }
}
