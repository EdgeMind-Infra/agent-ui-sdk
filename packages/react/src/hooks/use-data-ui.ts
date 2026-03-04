import type { ComponentType } from "react";
import { useEffect } from "react";
import { useAgentUI } from "../provider";

export interface UseDataUIOptions<T = unknown> {
  name: string;
  render: ComponentType<{ data: T }>;
  fallback?: ComponentType;
}

/**
 * Register a custom UI component for a named data part.
 * Automatically unregisters on unmount.
 *
 * @example
 * ```tsx
 * useDataUI({
 *   name: "artifact",
 *   render: ArtifactCard,
 * });
 * ```
 */
export function useDataUI<T = unknown>(options: UseDataUIOptions<T>): void {
  const { registry } = useAgentUI();

  useEffect(() => {
    return registry.registerDataUI({
      name: options.name,
      render: options.render,
      fallback: options.fallback,
    });
  }, [registry, options.name, options.render, options.fallback]);
}
