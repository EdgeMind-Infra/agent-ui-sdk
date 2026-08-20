/** @vitest-environment jsdom */
import type { ExportedMessage, ThreadHistoryAdapter } from "@agent-ui-sdk/core";
import type { UIMessage } from "ai";
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBranchedChat } from "../hooks/use-branched-chat";
import type { ChatHelpers } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMessage(id: string, text: string): UIMessage {
  return { id, role: "assistant", parts: [{ type: "text", text }] } as UIMessage;
}

/** Fresh object every call — mirrors useChat, whose return value is never referentially stable. */
function makeHelpers(messages: UIMessage[]): ChatHelpers {
  return {
    messages,
    status: "streaming",
    sendMessage: vi.fn(),
    stop: vi.fn(),
    error: undefined,
    setMessages: vi.fn(),
  };
}

let container: HTMLDivElement;
let root: Root;
let prevActEnv: unknown;

beforeEach(() => {
  const g = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  prevActEnv = g.IS_REACT_ACT_ENVIRONMENT;
  g.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  // Restore rather than leave it set — with vitest isolation off it would leak into sibling
  // files that deliberately run without an act environment.
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: unknown }).IS_REACT_ACT_ENVIRONMENT = prevActEnv;
  vi.useRealTimers();
});

/**
 * Publishing an extra render per chunk is what let React's nestedUpdateCount climb to #185 on
 * long threads: it happens inside a passive effect, so every commit ends with work still pending
 * and the counter never gets a chance to reset. The hook should only publish when the visible
 * branch structure actually changed.
 */
function renderHarness(initial: UIMessage[]) {
  let renders = 0;
  let push: (updater: (prev: UIMessage[]) => UIMessage[]) => void = () => {};

  function Harness() {
    const [messages, setMessages] = useState<UIMessage[]>(() => initial);
    push = setMessages;
    renders++;
    useBranchedChat({ chatHelpers: makeHelpers(messages) });
    return null;
  }

  act(() => root.render(<Harness />));
  return {
    rendersSince: (baseline: number) => renders - baseline,
    current: () => renders,
    push: (updater: (prev: UIMessage[]) => UIMessage[]) => act(() => push(updater)),
  };
}

describe("useBranchedChat — streaming churn", () => {
  it("a content-only update costs no extra render beyond the one that delivered it", () => {
    const h = renderHarness([makeMessage("m1", "hello"), makeMessage("m2", "wor")]);
    const baseline = h.current();

    // Streaming: only the message being generated is replaced; m1 keeps its identity.
    h.push((prev) => [prev[0]!, makeMessage("m2", "world")]);

    expect(h.rendersSince(baseline)).toBeLessThanOrEqual(1);
  });

  it("publishes a render when a new message enters the tree", () => {
    const h = renderHarness([makeMessage("m1", "hello")]);
    const baseline = h.current();

    h.push((prev) => [prev[0]!, makeMessage("m2", "new")]);

    // The branch structure changed, so getBranches()/getBranchCount() consumers must be told.
    expect(h.rendersSince(baseline)).toBeGreaterThan(1);
  });

  it("publishes a render when messages are truncated", () => {
    // regenerate() slices off the assistant turn: every surviving message is the same object, so
    // `newMessages` is empty and only the length change reveals that the tree moved.
    const h = renderHarness([makeMessage("m1", "hello"), makeMessage("m2", "reply")]);
    const baseline = h.current();

    h.push((prev) => [prev[0]!]);

    expect(h.rendersSince(baseline)).toBeGreaterThan(1);
  });
});

describe("useBranchedChat — persistence payload", () => {
  it("only queues the messages that actually changed", async () => {
    vi.useFakeTimers();
    const appended: ExportedMessage[][] = [];
    const historyAdapter: ThreadHistoryAdapter = {
      load: vi.fn(async () => []),
      append: vi.fn(async (_threadId: string, messages: ExportedMessage[]) => {
        appended.push(messages);
      }),
    } as unknown as ThreadHistoryAdapter;

    let push: (updater: (prev: UIMessage[]) => UIMessage[]) => void = () => {};

    function Harness() {
      const [messages, setMessages] = useState<UIMessage[]>(() => [
        makeMessage("m1", "one"),
        makeMessage("m2", "two"),
        makeMessage("m3", "thr"),
      ]);
      push = setMessages;
      useBranchedChat({ chatHelpers: makeHelpers(messages), historyAdapter, threadId: "t1" });
      return null;
    }

    await act(async () => {
      root.render(<Harness />);
    });
    appended.length = 0;

    // Streaming update: m1 / m2 keep their identity (same objects), only m3 grows.
    await act(async () => {
      push((prev) => [prev[0]!, prev[1]!, makeMessage("m3", "three")]);
    });
    await act(async () => {
      vi.advanceTimersByTime(400);
    });

    // Before the reference check, this flushed the whole thread every 300ms.
    expect(appended).toHaveLength(1);
    expect(appended[0]!.map((e) => e.message.id)).toEqual(["m3"]);
  });
});
