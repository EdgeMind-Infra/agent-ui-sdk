import type { ComponentType } from "react";
import { useEffect } from "react";
import { useAgentUI } from "../provider";

export interface UseToolUIOptions<TInput = unknown, TOutput = unknown> {
  toolName: string;
  render: ComponentType<{ input: TInput; output?: TOutput; state?: string }>;
  fallback?: ComponentType;
}

/**
 * Register a custom UI component for a specific tool.
 * Automatically unregisters on unmount.
 *
 * @example
 * ```tsx
 * useToolUI({
 *   toolName: "websearch",
 *   render: WebSearchCard,
 * });
 * ```
 */
export function useToolUI<TInput = unknown, TOutput = unknown>(
  options: UseToolUIOptions<TInput, TOutput>,
): void {
  const registry = useAgentUI((s) => s.registry);

  useEffect(() => {
    return registry.registerToolUI({
      toolName: options.toolName,
      render: options.render,
      fallback: options.fallback,
    });
  }, [registry, options.toolName, options.render, options.fallback]);
}
