import type { UIMessage } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageHistoryAdapter } from "../adapters/local-storage-history-adapter";
import { LocalStorageThreadListAdapter } from "../adapters/local-storage-thread-list-adapter";
import type { ExportedMessage } from "../types";

// Mock localStorage
const store = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => store.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => store.set(key, value)),
  removeItem: vi.fn((key: string) => store.delete(key)),
  clear: vi.fn(() => store.clear()),
  get length() {
    return store.size;
  },
  key: vi.fn((index: number) => [...store.keys()][index] ?? null),
};

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

function msg(id: string, role: "user" | "assistant" = "user", text = `msg-${id}`): UIMessage {
  return { id, role, parts: [{ type: "text", text }] };
}

function exported(id: string, parentId: string | null = null): ExportedMessage {
  return { message: msg(id), parentId };
}

describe("LocalStorageHistoryAdapter", () => {
  let adapter: LocalStorageHistoryAdapter;

  beforeEach(() => {
    store.clear();
    adapter = new LocalStorageHistoryAdapter();
  });

  it("returns empty array for non-existent thread", async () => {
    const messages = await adapter.load("unknown");
    expect(messages).toEqual([]);
  });

  it("saves and loads messages", async () => {
    const msgs = [exported("1"), exported("2", "1")];
    await adapter.save("t1", msgs);
    const loaded = await adapter.load("t1");
    expect(loaded).toEqual(msgs);
  });

  it("appends messages to existing thread", async () => {
    await adapter.save("t1", [exported("1")]);
    await adapter.append("t1", [exported("2", "1")]);
    const loaded = await adapter.load("t1");
    expect(loaded).toHaveLength(2);
    expect(loaded[1]!.message.id).toBe("2");
  });

  it("appends to empty thread", async () => {
    await adapter.append("t1", [exported("1")]);
    const loaded = await adapter.load("t1");
    expect(loaded).toHaveLength(1);
  });

  it("removeThread deletes the storage key", async () => {
    await adapter.save("t1", [exported("1")]);
    adapter.removeThread("t1");
    const loaded = await adapter.load("t1");
    expect(loaded).toEqual([]);
  });

  it("uses custom prefix", async () => {
    const custom = new LocalStorageHistoryAdapter({ prefix: "myapp" });
    await custom.save("t1", [exported("1")]);
    expect(store.has("myapp:thread:t1")).toBe(true);
    expect(store.has("edgemind:thread:t1")).toBe(false);
  });

  it("handles corrupted JSON gracefully", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    store.set("edgemind:thread:corrupt", "not-valid-json{{{");
    const loaded = await adapter.load("corrupt");
    expect(loaded).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe("LocalStorageThreadListAdapter", () => {
  let adapter: LocalStorageThreadListAdapter;

  beforeEach(() => {
    store.clear();
    adapter = new LocalStorageThreadListAdapter();
  });

  afterEach(() => {
    store.clear();
  });

  it("returns empty array when no threads exist", async () => {
    const threads = await adapter.list();
    expect(threads).toEqual([]);
  });

  it("creates a thread with generated id", async () => {
    const thread = await adapter.create({ title: "Hello" });
    expect(thread.id).toBeTruthy();
    expect(thread.title).toBe("Hello");
    expect(thread.favorited).toBe(false);
    expect(thread.createdAt).toBeInstanceOf(Date);
  });

  it("lists threads sorted by updatedAt descending", async () => {
    const t1 = await adapter.create({ title: "First" });
    // Ensure different timestamps
    await new Promise((r) => setTimeout(r, 5));
    const t2 = await adapter.create({ title: "Second" });

    const threads = await adapter.list();
    expect(threads).toHaveLength(2);
    expect(threads[0]!.id).toBe(t2.id);
    expect(threads[1]!.id).toBe(t1.id);
  });

  it("renames a thread", async () => {
    const thread = await adapter.create({ title: "Old" });
    await adapter.rename(thread.id, "New");
    const threads = await adapter.list();
    expect(threads[0]!.title).toBe("New");
  });

  it("deletes a thread and its messages", async () => {
    const thread = await adapter.create({ title: "ToDelete" });
    // Simulate stored messages
    store.set(`edgemind:thread:${thread.id}`, JSON.stringify([exported("1")]));

    await adapter.delete(thread.id);
    const threads = await adapter.list();
    expect(threads).toHaveLength(0);
    expect(store.has(`edgemind:thread:${thread.id}`)).toBe(false);
  });

  it("favorites a thread", async () => {
    const thread = await adapter.create({ title: "Fav" });
    await adapter.favorite(thread.id);
    const threads = await adapter.list();
    expect(threads.find((t) => t.id === thread.id)!.favorited).toBe(true);
  });

  it("unfavorites a thread", async () => {
    const thread = await adapter.create({ title: "Fav" });
    await adapter.favorite(thread.id);
    await adapter.unfavorite(thread.id);
    const threads = await adapter.list();
    expect(threads.find((t) => t.id === thread.id)!.favorited).toBe(false);
  });

  it("uses custom prefix", async () => {
    const custom = new LocalStorageThreadListAdapter({ prefix: "myapp" });
    await custom.create({ title: "Test" });
    expect(store.has("myapp:threads")).toBe(true);
    expect(store.has("edgemind:threads")).toBe(false);
  });

  it("handles corrupted JSON gracefully", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    store.set("edgemind:threads", "broken!!!json");
    const threads = await adapter.list();
    expect(threads).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
