/**
 * UIRegistry — Dynamic registration system for Tool and Data UI renderers.
 *
 * Inspired by assistant-ui's useToolUI / useAssistantDataUI pattern.
 * Instead of hardcoding tool/data renderers in a giant switch statement,
 * components register themselves declaratively and the renderer looks them up.
 *
 * Platform-agnostic: the registry stores component references as `unknown`,
 * and platform bindings (React/RN) cast them to the appropriate component type.
 */

/** A tool UI registration entry */
export interface ToolUIRegistration {
  toolName: string;
  /** The component to render. Type is `unknown` here — platform bindings cast it. */
  render: unknown;
  /** Fallback component when tool state is loading */
  fallback?: unknown;
}

/** A data UI registration entry */
export interface DataUIRegistration {
  name: string;
  /** The component to render. */
  render: unknown;
  /** Fallback component */
  fallback?: unknown;
}

/** The state of a UIRegistry */
export interface UIRegistryState {
  tools: Map<string, ToolUIRegistration[]>;
  data: Map<string, DataUIRegistration[]>;
}

/** Listener callback type */
type Listener = () => void;

/**
 * Registry for dynamic UI component registration.
 * Supports stack-based registration (multiple registrations per name,
 * latest takes priority — useful for scoped overrides).
 */
export class UIRegistry {
  private state: UIRegistryState = {
    tools: new Map(),
    data: new Map(),
  };
  private listeners = new Set<Listener>();

  /** Register a tool UI renderer. Returns an unregister function. */
  registerToolUI(registration: ToolUIRegistration): () => void {
    const { toolName } = registration;
    const stack = this.state.tools.get(toolName) ?? [];
    stack.push(registration);
    this.state.tools.set(toolName, stack);
    this.notify();

    return () => {
      const current = this.state.tools.get(toolName);
      if (current) {
        const index = current.indexOf(registration);
        if (index !== -1) {
          current.splice(index, 1);
          if (current.length === 0) {
            this.state.tools.delete(toolName);
          }
          this.notify();
        }
      }
    };
  }

  /** Register a data UI renderer. Returns an unregister function. */
  registerDataUI(registration: DataUIRegistration): () => void {
    const { name } = registration;
    const stack = this.state.data.get(name) ?? [];
    stack.push(registration);
    this.state.data.set(name, stack);
    this.notify();

    return () => {
      const current = this.state.data.get(name);
      if (current) {
        const index = current.indexOf(registration);
        if (index !== -1) {
          current.splice(index, 1);
          if (current.length === 0) {
            this.state.data.delete(name);
          }
          this.notify();
        }
      }
    };
  }

  /** Get the current active tool UI registration (top of stack) */
  getToolUI(toolName: string): ToolUIRegistration | undefined {
    const stack = this.state.tools.get(toolName);
    return stack?.[stack.length - 1];
  }

  /** Get the current active data UI registration (top of stack) */
  getDataUI(name: string): DataUIRegistration | undefined {
    const stack = this.state.data.get(name);
    return stack?.[stack.length - 1];
  }

  /** Subscribe to registry changes */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Get a snapshot of current registrations */
  getSnapshot(): UIRegistryState {
    return this.state;
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

/** Create a new UIRegistry instance */
export function createUIRegistry(): UIRegistry {
  return new UIRegistry();
}
