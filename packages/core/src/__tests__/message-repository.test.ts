import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { MessageRepository } from "../message-repository";

function msg(id: string, role: "user" | "assistant" = "user", text = `msg-${id}`): UIMessage {
  return {
    id,
    role,
    parts: [{ type: "text", text }],
  };
}

describe("MessageRepository", () => {
  describe("addOrUpdateMessage + getMessages", () => {
    it("returns messages in order for a linear conversation", () => {
      const repo = new MessageRepository();
      const m1 = msg("1", "user");
      const m2 = msg("2", "assistant");
      const m3 = msg("3", "user");

      repo.addOrUpdateMessage(null, m1);
      repo.addOrUpdateMessage("1", m2);
      repo.addOrUpdateMessage("2", m3);

      expect(repo.getMessages()).toEqual([m1, m2, m3]);
      expect(repo.headId).toBe("3");
    });

    it("updates message content in place", () => {
      const repo = new MessageRepository();
      repo.addOrUpdateMessage(null, msg("1", "user", "original"));
      repo.addOrUpdateMessage("1", msg("2", "assistant", "response"));

      const updated = msg("2", "assistant", "updated response");
      repo.addOrUpdateMessage("1", updated);

      const messages = repo.getMessages();
      expect(messages).toHaveLength(2);
      expect(messages[1]!.parts[0]).toEqual({ type: "text", text: "updated response" });
    });

    it("returns empty array for empty repository", () => {
      const repo = new MessageRepository();
      expect(repo.getMessages()).toEqual([]);
      expect(repo.headId).toBeNull();
    });
  });

  describe("branching", () => {
    it("creates branches when adding multiple children to same parent", () => {
      const repo = new MessageRepository();
      repo.addOrUpdateMessage(null, msg("u1", "user"));
      repo.addOrUpdateMessage("u1", msg("a1", "assistant", "response v1"));
      repo.addOrUpdateMessage("u1", msg("a2", "assistant", "response v2"));

      // Latest branch is active (a2)
      expect(repo.getMessages().map((m) => m.id)).toEqual(["u1", "a2"]);

      // getBranches returns both
      const branches = repo.getBranches("a1");
      expect(branches.map((m) => m.id)).toEqual(["a1", "a2"]);
    });

    it("switchToBranch changes the active path", () => {
      const repo = new MessageRepository();
      repo.addOrUpdateMessage(null, msg("u1", "user"));
      repo.addOrUpdateMessage("u1", msg("a1", "assistant"));
      repo.addOrUpdateMessage("a1", msg("u2", "user")); // deep child of a1

      // Create branch: another response to u1
      repo.addOrUpdateMessage("u1", msg("a2", "assistant"));

      // Active path is u1 → a2 (latest)
      expect(repo.getMessages().map((m) => m.id)).toEqual(["u1", "a2"]);

      // Switch to a1 branch
      repo.switchToBranch("a1");
      expect(repo.getMessages().map((m) => m.id)).toEqual(["u1", "a1", "u2"]);
      expect(repo.headId).toBe("u2");
    });

    it("switchToBranch with root-level branches", () => {
      const repo = new MessageRepository();
      repo.addOrUpdateMessage(null, msg("u1", "user", "first conv"));
      repo.addOrUpdateMessage("u1", msg("a1", "assistant"));

      // Another root message (branching at root)
      repo.addOrUpdateMessage(null, msg("u2", "user", "second conv"));

      expect(repo.getMessages().map((m) => m.id)).toEqual(["u2"]);

      repo.switchToBranch("u1");
      expect(repo.getMessages().map((m) => m.id)).toEqual(["u1", "a1"]);
    });
  });

  describe("getBranches", () => {
    it("returns single-element array for messages without siblings", () => {
      const repo = new MessageRepository();
      repo.addOrUpdateMessage(null, msg("u1", "user"));
      repo.addOrUpdateMessage("u1", msg("a1", "assistant"));

      expect(repo.getBranches("u1")).toHaveLength(1);
      expect(repo.getBranches("a1")).toHaveLength(1);
    });

    it("returns empty array for unknown message", () => {
      const repo = new MessageRepository();
      expect(repo.getBranches("nonexistent")).toEqual([]);
    });
  });

  describe("deleteMessage", () => {
    it("deletes a message and its descendants", () => {
      const repo = new MessageRepository();
      repo.addOrUpdateMessage(null, msg("u1", "user"));
      repo.addOrUpdateMessage("u1", msg("a1", "assistant"));
      repo.addOrUpdateMessage("a1", msg("u2", "user"));
      repo.addOrUpdateMessage("u2", msg("a2", "assistant"));

      repo.deleteMessage("a1");

      expect(repo.size).toBe(1); // only u1 remains
      expect(repo.getMessages().map((m) => m.id)).toEqual(["u1"]);
    });

    it("recomputes head after deletion", () => {
      const repo = new MessageRepository();
      repo.addOrUpdateMessage(null, msg("u1", "user"));
      repo.addOrUpdateMessage("u1", msg("a1", "assistant"));

      repo.deleteMessage("a1");
      expect(repo.headId).toBe("u1");
    });

    it("handles deletion of one branch while another exists", () => {
      const repo = new MessageRepository();
      repo.addOrUpdateMessage(null, msg("u1", "user"));
      repo.addOrUpdateMessage("u1", msg("a1", "assistant"));
      repo.addOrUpdateMessage("u1", msg("a2", "assistant"));

      repo.deleteMessage("a2");

      expect(repo.getBranches("a1")).toHaveLength(1);
      expect(repo.getMessages().map((m) => m.id)).toEqual(["u1", "a1"]);
    });
  });

  describe("resetHead", () => {
    it("sets head to specified message", () => {
      const repo = new MessageRepository();
      repo.addOrUpdateMessage(null, msg("u1", "user"));
      repo.addOrUpdateMessage("u1", msg("a1", "assistant"));
      repo.addOrUpdateMessage("a1", msg("u2", "user"));

      repo.resetHead("a1");
      expect(repo.headId).toBe("a1");
    });

    it("sets head to null when passed null", () => {
      const repo = new MessageRepository();
      repo.addOrUpdateMessage(null, msg("u1", "user"));
      repo.resetHead(null);
      expect(repo.headId).toBeNull();
    });

    it("ignores unknown message IDs", () => {
      const repo = new MessageRepository();
      repo.addOrUpdateMessage(null, msg("u1", "user"));
      repo.resetHead("nonexistent");
      expect(repo.headId).toBe("u1"); // unchanged
    });
  });

  describe("export / import", () => {
    it("round-trips correctly", () => {
      const repo = new MessageRepository();
      repo.addOrUpdateMessage(null, msg("u1", "user"));
      repo.addOrUpdateMessage("u1", msg("a1", "assistant"));
      repo.addOrUpdateMessage("u1", msg("a2", "assistant")); // branch
      repo.addOrUpdateMessage("a2", msg("u2", "user"));

      const exported = repo.export();

      const repo2 = new MessageRepository();
      repo2.import(exported);

      expect(repo2.size).toBe(4);
      // After import, the active path should follow the last-added branches
      expect(repo2.getMessages().map((m) => m.id)).toEqual(["u1", "a2", "u2"]);

      // Branches preserved
      expect(repo2.getBranches("a1").map((m) => m.id)).toEqual(["a1", "a2"]);
    });

    it("import clears existing data", () => {
      const repo = new MessageRepository();
      repo.addOrUpdateMessage(null, msg("old", "user"));

      repo.import([{ message: msg("new", "user"), parentId: null }]);

      expect(repo.size).toBe(1);
      expect(repo.getMessages().map((m) => m.id)).toEqual(["new"]);
    });
  });

  describe("getNode", () => {
    it("returns the node for a known ID", () => {
      const repo = new MessageRepository();
      repo.addOrUpdateMessage(null, msg("u1", "user"));
      repo.addOrUpdateMessage("u1", msg("a1", "assistant"));

      const node = repo.getNode("a1");
      expect(node).toBeDefined();
      expect(node!.parentId).toBe("u1");
      expect(node!.message.id).toBe("a1");
    });

    it("returns undefined for unknown ID", () => {
      const repo = new MessageRepository();
      expect(repo.getNode("nope")).toBeUndefined();
    });
  });

  describe("complex scenarios", () => {
    it("handles deep branching tree", () => {
      const repo = new MessageRepository();
      // Linear: u1 → a1 → u2 → a2
      repo.addOrUpdateMessage(null, msg("u1", "user"));
      repo.addOrUpdateMessage("u1", msg("a1", "assistant"));
      repo.addOrUpdateMessage("a1", msg("u2", "user"));
      repo.addOrUpdateMessage("u2", msg("a2", "assistant"));

      // Branch at u2: alternative response
      repo.addOrUpdateMessage("u2", msg("a3", "assistant"));

      // Active path should be u1 → a1 → u2 → a3
      expect(repo.getMessages().map((m) => m.id)).toEqual(["u1", "a1", "u2", "a3"]);

      // Switch back to a2
      repo.switchToBranch("a2");
      expect(repo.getMessages().map((m) => m.id)).toEqual(["u1", "a1", "u2", "a2"]);

      // Branch at u1 level: alternative response
      repo.addOrUpdateMessage("u1", msg("a4", "assistant"));
      // Now active is u1 → a4
      expect(repo.getMessages().map((m) => m.id)).toEqual(["u1", "a4"]);

      // Switch back to a1 branch — should follow down to u2 → a2 (the previously set active)
      repo.switchToBranch("a1");
      expect(repo.getMessages().map((m) => m.id)).toEqual(["u1", "a1", "u2", "a2"]);
    });
  });
});
