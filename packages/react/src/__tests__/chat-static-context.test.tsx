/** @vitest-environment jsdom */
import type { UIMessage } from "ai";
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ChatProvider,
  type ChatStaticContextValue,
  useChatContext,
  useChatStatic,
} from "../chat/chat-provider";
import type { ChatComponents, ChatConfig, ChatHelpers } from "../types";

function makeMessage(id: string, text: string): UIMessage {
  return { id, role: "assistant", parts: [{ type: "text", text }] } as UIMessage;
}

/** Fresh object every render — exactly what useChat hands back. */
function makeHelpers(messages: UIMessage[], overrides: Partial<ChatHelpers> = {}): ChatHelpers {
  return {
    messages,
    status: "streaming",
    sendMessage: vi.fn(),
    stop: vi.fn(),
    error: undefined,
    setMessages: vi.fn(),
    addToolApprovalResponse: vi.fn(),
    ...overrides,
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
  // Restore rather than leave it set: with vitest isolation off this flag would leak into
  // sibling files that deliberately run without an act environment.
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: unknown }).IS_REACT_ACT_ENVIRONMENT = prevActEnv;
});

/**
 * The static context is what makes `memo()` on message cards worth anything: a context update
 * re-renders every consumer regardless of memo, so if this value churned per streaming chunk the
 * whole message list would repaint on every token.
 */
describe("useChatStatic", () => {
  const COMPONENTS: ChatComponents = {};
  const CONFIG: ChatConfig = {};

  interface SetupOptions {
    helperOverrides?: Partial<ChatHelpers>;
    /** Rebuild `config` on every render — what an un-memoized caller does. */
    unstableConfig?: boolean;
  }

  function setup({ helperOverrides = {}, unstableConfig = false }: SetupOptions = {}) {
    const staticValues: ChatStaticContextValue[] = [];
    const fullValues: unknown[] = [];
    let push: (messages: UIMessage[]) => void = () => {};
    let swapHelpers: (overrides: Partial<ChatHelpers>) => void = () => {};

    function StaticProbe() {
      staticValues.push(useChatStatic());
      return null;
    }
    function FullProbe() {
      fullValues.push(useChatContext());
      return null;
    }
    function Harness() {
      const [messages, setMessages] = useState<UIMessage[]>(() => [makeMessage("m1", "a")]);
      const [overrides, setOverrides] = useState<Partial<ChatHelpers>>(helperOverrides);
      push = setMessages;
      swapHelpers = setOverrides;
      return (
        <ChatProvider
          chatHelpers={makeHelpers(messages, overrides)}
          components={COMPONENTS}
          config={unstableConfig ? { ...CONFIG } : CONFIG}
        >
          <StaticProbe />
          <FullProbe />
        </ChatProvider>
      );
    }

    act(() => root.render(<Harness />));
    return {
      staticValues,
      fullValues,
      push: (m: UIMessage[]) => act(() => push(m)),
      swapHelpers: (o: Partial<ChatHelpers>) => act(() => swapHelpers(o)),
    };
  }

  it("keeps the same value across streaming updates", () => {
    const { staticValues, push } = setup();

    push([makeMessage("m1", "ab")]);
    push([makeMessage("m1", "abc")]);

    expect(staticValues.length).toBeGreaterThanOrEqual(3);
    for (const v of staticValues) expect(v).toBe(staticValues[0]);
  });

  it("still hands the full context a fresh value (it carries messages)", () => {
    const { fullValues, push } = setup();

    push([makeMessage("m1", "ab")]);

    expect(fullValues[1]).not.toBe(fullValues[0]);
  });

  it("documents the caller's obligation: an unstable `config` breaks the guarantee", () => {
    // Not a bug in ChatProvider — the point is that config identity is load-bearing, so callers
    // must memoize it. Spelled out as a test so the requirement is not folded away by accident.
    const { staticValues, push } = setup({ unstableConfig: true });

    push([makeMessage("m1", "ab")]);

    expect(staticValues.at(-1)).not.toBe(staticValues[0]);
  });

  it("forwards through to whatever helpers rendered last", () => {
    const first = vi.fn();
    const { staticValues, swapHelpers } = setup({ helperOverrides: { sendMessage: first } });
    const { chatActions } = staticValues[0]!;

    const second = vi.fn();
    swapHelpers({ sendMessage: second });

    // Same chatActions object as before the swap, but it now reaches the new helpers.
    expect(staticValues.at(-1)!.chatActions).toBe(chatActions);
    chatActions.sendMessage({ text: "hi" });
    expect(second).toHaveBeenCalledWith({ text: "hi" });
    expect(first).not.toHaveBeenCalled();
  });

  it("leaves optional actions undefined when the helpers do not implement them", () => {
    const { staticValues } = setup({ helperOverrides: { addToolApprovalResponse: undefined } });

    // Consumers gate UI on this being absent — an always-truthy no-op would silently turn
    // "unsupported" into "supported but does nothing".
    expect(staticValues[0]!.chatActions.addToolApprovalResponse).toBeUndefined();
    expect(staticValues[0]!.chatActions.sendMessage).toBeTypeOf("function");
  });
});
