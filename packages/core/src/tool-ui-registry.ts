/**
 * Platform-agnostic registry for tool UI renderers.
 *
 * Maps toolName → renderer (stored as `unknown` to avoid framework dependencies).
 * React/RN packages wrap this with typed hooks (useToolUI, makeToolUI).
 *
 * Designed for use with React's `useSyncExternalStore`:
 * - `subscribe(listener)` → called on every change
 * - `getSnapshot()` → returns referentially stable snapshot (same object if unchanged)
 */
export class ToolUIRegistry {
  private renderers = new Map<string, unknown>();
  private listeners = new Set<() => void>();
  private snapshot: Readonly<Record<string, unknown>> = {};

  /**
   * Register a renderer for a given toolName.
   * Later registrations overwrite earlier ones for the same toolName.
   * @returns An unsubscribe function that removes this renderer.
   */
  register(toolName: string, renderer: unknown): () => void {
    this.renderers.set(toolName, renderer);
    this.updateSnapshot();

    return () => {
      // Only remove if the current renderer is still the one we registered
      if (this.renderers.get(toolName) === renderer) {
        this.renderers.delete(toolName);
        this.updateSnapshot();
      }
    };
  }

  /**
   * Look up the renderer for a given toolName.
   */
  get(toolName: string): unknown | undefined {
    return this.renderers.get(toolName);
  }

  /**
   * Subscribe to registry changes.
   * Compatible with React's `useSyncExternalStore`.
   * @returns An unsubscribe function.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Returns an immutable snapshot of all registered renderers.
   * Returns the same object reference when nothing has changed.
   * Compatible with React's `useSyncExternalStore`.
   */
  getSnapshot(): Readonly<Record<string, unknown>> {
    return this.snapshot;
  }

  private updateSnapshot(): void {
    this.snapshot = Object.freeze(Object.fromEntries(this.renderers));
    for (const listener of this.listeners) {
      listener();
    }
  }
}
