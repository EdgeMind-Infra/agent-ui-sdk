/** @vitest-environment jsdom */
import type { ToolUIRegistry } from "@agent-ui-sdk/core";
import React, { createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatProvider, useChatContext } from "../chat/chat-provider";
import { useToolUI } from "../hooks/use-tool-ui";
import { makeToolUI } from "../model-context/make-tool-ui";
import type { ChatHelpers, ToolUIRendererComponent } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stubChatHelpers(): ChatHelpers {
  return {
    messages: [],
    status: "ready",
    sendMessage: vi.fn(),
    stop: vi.fn(),
    error: undefined,
  };
}

function Wrapper({
  children,
  toolRenderers,
}: {
  children: React.ReactNode;
  toolRenderers?: Record<string, ToolUIRendererComponent>;
}) {
  return (
    <ChatProvider chatHelpers={stubChatHelpers()} toolRenderers={toolRenderers}>
      {children}
    </ChatProvider>
  );
}

let capturedRegistry: ToolUIRegistry | null = null;
let capturedToolRenderers: Record<string, ToolUIRendererComponent> | undefined;

function RegistrySpy() {
  const ctx = useChatContext();
  capturedRegistry = ctx.toolUIRegistry;
  capturedToolRenderers = ctx.toolRenderers;
  return null;
}

// ---------------------------------------------------------------------------
// DOM setup
// ---------------------------------------------------------------------------

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  capturedRegistry = null;
  capturedToolRenderers = undefined;
});

afterEach(() => {
  React.act(() => root.unmount());
  container.remove();
});

async function renderUI(element: React.ReactNode) {
  await React.act(async () => {
    root.render(element);
  });
}

// ---------------------------------------------------------------------------
// useToolUI
// ---------------------------------------------------------------------------

describe("useToolUI", () => {
  it("registers a renderer into the registry on mount", async () => {
    const renderer: ToolUIRendererComponent = (props) =>
      createElement("div", null, `tool: ${props.toolName}`);

    function Consumer() {
      useToolUI({ toolName: "web_search", render: renderer });
      return null;
    }

    await renderUI(
      <Wrapper>
        <RegistrySpy />
        <Consumer />
      </Wrapper>,
    );

    expect(capturedRegistry).toBeTruthy();
    expect(capturedRegistry!.get("web_search")).toBe(renderer);
  });

  it("unregisters on unmount", async () => {
    const renderer: ToolUIRendererComponent = () => createElement("span");

    function Consumer() {
      useToolUI({ toolName: "code_exec", render: renderer });
      return null;
    }

    let toggle!: () => void;
    function Toggle() {
      const [show, setShow] = useState(true);
      toggle = () => setShow((s) => !s);
      return show ? <Consumer /> : null;
    }

    await renderUI(
      <Wrapper>
        <RegistrySpy />
        <Toggle />
      </Wrapper>,
    );

    expect(capturedRegistry!.get("code_exec")).toBe(renderer);

    await React.act(async () => toggle());

    expect(capturedRegistry!.get("code_exec")).toBeUndefined();
  });

  it("does nothing when options is null", async () => {
    function Consumer() {
      useToolUI(null);
      return null;
    }

    await renderUI(
      <Wrapper>
        <RegistrySpy />
        <Consumer />
      </Wrapper>,
    );

    expect(Object.keys(capturedRegistry!.getSnapshot())).toHaveLength(0);
  });

  it("re-registers when toolName changes", async () => {
    const renderer: ToolUIRendererComponent = () => createElement("span");

    let updateToolName!: (name: string) => void;

    function Consumer() {
      const [toolName, setToolName] = useState("tool_a");
      updateToolName = setToolName;
      useToolUI({ toolName, render: renderer });
      return null;
    }

    await renderUI(
      <Wrapper>
        <RegistrySpy />
        <Consumer />
      </Wrapper>,
    );

    expect(capturedRegistry!.get("tool_a")).toBe(renderer);

    await React.act(async () => updateToolName("tool_b"));

    expect(capturedRegistry!.get("tool_a")).toBeUndefined();
    expect(capturedRegistry!.get("tool_b")).toBe(renderer);
  });
});

// ---------------------------------------------------------------------------
// makeToolUI
// ---------------------------------------------------------------------------

describe("makeToolUI", () => {
  it("returns a component that renders null (invisible)", async () => {
    const ToolUI = makeToolUI({
      toolName: "file_search",
      render: () => createElement("div", null, "should not appear"),
    });

    await renderUI(
      <Wrapper>
        <ToolUI />
      </Wrapper>,
    );

    expect(container.textContent).toBe("");
  });

  it("registers on mount and unregisters on unmount", async () => {
    const renderer: ToolUIRendererComponent = () => createElement("div");

    const ToolUI = makeToolUI({
      toolName: "calculator",
      render: renderer,
    });

    let toggle!: () => void;
    function Toggle() {
      const [show, setShow] = useState(true);
      toggle = () => setShow((s) => !s);
      return show ? <ToolUI /> : null;
    }

    await renderUI(
      <Wrapper>
        <RegistrySpy />
        <Toggle />
      </Wrapper>,
    );

    expect(capturedRegistry!.get("calculator")).toBe(renderer);

    await React.act(async () => toggle());

    expect(capturedRegistry!.get("calculator")).toBeUndefined();
  });

  it("has displayName set", () => {
    const ToolUI = makeToolUI({
      toolName: "web_search",
      render: () => null,
    });
    expect(ToolUI.displayName).toBe("ToolUI(web_search)");
  });

  it("has _toolUI metadata", () => {
    const render: ToolUIRendererComponent = () => null;
    const ToolUI = makeToolUI({ toolName: "web_search", render });
    expect(ToolUI._toolUI.toolName).toBe("web_search");
    expect(ToolUI._toolUI.render).toBe(render);
  });
});

// ---------------------------------------------------------------------------
// ChatProvider + toolRenderers prop
// ---------------------------------------------------------------------------

describe("ChatProvider toolRenderers prop", () => {
  it("passes toolRenderers through context", async () => {
    const renderer: ToolUIRendererComponent = () => createElement("div");
    const renderers = { my_tool: renderer };

    await renderUI(
      <Wrapper toolRenderers={renderers}>
        <RegistrySpy />
      </Wrapper>,
    );

    expect(capturedToolRenderers).toBe(renderers);
    expect(capturedToolRenderers!.my_tool).toBe(renderer);
  });
});

// ---------------------------------------------------------------------------
// Registry instance stability
// ---------------------------------------------------------------------------

describe("ChatProvider registry stability", () => {
  it("provides the same ToolUIRegistry instance across re-renders", async () => {
    const registries: ToolUIRegistry[] = [];

    let forceUpdate!: () => void;

    function Collector() {
      const [, setState] = useState(0);
      forceUpdate = () => setState((n) => n + 1);
      const ctx = useChatContext();
      registries.push(ctx.toolUIRegistry);
      return null;
    }

    await renderUI(
      <Wrapper>
        <Collector />
      </Wrapper>,
    );

    await React.act(async () => forceUpdate());

    expect(registries).toHaveLength(2);
    expect(registries[0]).toBe(registries[1]);
  });
});
