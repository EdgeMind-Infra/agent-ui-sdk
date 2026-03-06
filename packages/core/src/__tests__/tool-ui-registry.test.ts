import { describe, expect, it, vi } from "vitest";
import { ToolUIRegistry } from "../tool-ui-registry";

describe("ToolUIRegistry", () => {
  it("returns undefined for unregistered tools", () => {
    const registry = new ToolUIRegistry();
    expect(registry.get("unknown")).toBeUndefined();
  });

  it("registers and retrieves a renderer", () => {
    const registry = new ToolUIRegistry();
    const renderer = () => "SearchUI";
    registry.register("web_search", renderer);
    expect(registry.get("web_search")).toBe(renderer);
  });

  it("unregisters a renderer via returned unsubscribe", () => {
    const registry = new ToolUIRegistry();
    const renderer = () => "SearchUI";
    const unsubscribe = registry.register("web_search", renderer);

    unsubscribe();
    expect(registry.get("web_search")).toBeUndefined();
  });

  it("later registration overwrites earlier one", () => {
    const registry = new ToolUIRegistry();
    const rendererA = () => "A";
    const rendererB = () => "B";

    registry.register("search", rendererA);
    registry.register("search", rendererB);

    expect(registry.get("search")).toBe(rendererB);
  });

  it("unsubscribing old renderer does not remove newer one", () => {
    const registry = new ToolUIRegistry();
    const rendererA = () => "A";
    const rendererB = () => "B";

    const unsubA = registry.register("search", rendererA);
    registry.register("search", rendererB);

    unsubA(); // should NOT remove rendererB
    expect(registry.get("search")).toBe(rendererB);
  });

  describe("subscribe", () => {
    it("notifies listeners on register", () => {
      const registry = new ToolUIRegistry();
      const listener = vi.fn();

      registry.subscribe(listener);
      registry.register("tool", () => {});

      expect(listener).toHaveBeenCalledOnce();
    });

    it("notifies listeners on unregister", () => {
      const registry = new ToolUIRegistry();
      const listener = vi.fn();
      const unsub = registry.register("tool", () => {});

      registry.subscribe(listener);
      unsub();

      expect(listener).toHaveBeenCalledOnce();
    });

    it("stops notifying after unsubscribe", () => {
      const registry = new ToolUIRegistry();
      const listener = vi.fn();

      const unsubListener = registry.subscribe(listener);
      unsubListener();

      registry.register("tool", () => {});
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("getSnapshot", () => {
    it("returns empty object for empty registry", () => {
      const registry = new ToolUIRegistry();
      expect(registry.getSnapshot()).toEqual({});
    });

    it("returns registered renderers", () => {
      const registry = new ToolUIRegistry();
      const renderer = () => "UI";
      registry.register("search", renderer);
      registry.register("calc", renderer);

      const snapshot = registry.getSnapshot();
      expect(snapshot).toEqual({ search: renderer, calc: renderer });
    });

    it("returns same reference when unchanged", () => {
      const registry = new ToolUIRegistry();
      registry.register("tool", () => {});

      const snap1 = registry.getSnapshot();
      const snap2 = registry.getSnapshot();
      expect(snap1).toBe(snap2);
    });

    it("returns new reference after change", () => {
      const registry = new ToolUIRegistry();
      registry.register("tool1", () => {});
      const snap1 = registry.getSnapshot();

      registry.register("tool2", () => {});
      const snap2 = registry.getSnapshot();

      expect(snap1).not.toBe(snap2);
    });

    it("snapshot is frozen (immutable)", () => {
      const registry = new ToolUIRegistry();
      registry.register("tool", () => {});

      const snapshot = registry.getSnapshot();
      expect(Object.isFrozen(snapshot)).toBe(true);
    });
  });
});
