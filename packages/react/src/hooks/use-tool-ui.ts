"use client";

import { useEffect } from "react";
import { useChatContext } from "../chat/chat-provider";
import type { ToolUIRendererComponent } from "../types";

export interface UseToolUIOptions<TArgs = unknown, TResult = unknown> {
  toolName: string;
  render: ToolUIRendererComponent<TArgs, TResult>;
}

/**
 * Register a custom renderer for a specific tool.
 *
 * The renderer is registered when the component mounts and automatically
 * unregistered when it unmounts. If toolName changes, the old registration
 * is cleaned up and a new one is created.
 *
 * @example
 * ```tsx
 * useToolUI({
 *   toolName: "web_search",
 *   render: ({ input, output, state }) => (
 *     <SearchCard query={input?.query} results={output} loading={state === "input-streaming"} />
 *   ),
 * });
 * ```
 */
export function useToolUI<TArgs = unknown, TResult = unknown>(
  options: UseToolUIOptions<TArgs, TResult> | null,
): void {
  const { toolUIRegistry } = useChatContext();

  useEffect(() => {
    if (!options?.toolName || !options?.render) return undefined;
    return toolUIRegistry.register(options.toolName, options.render);
  }, [toolUIRegistry, options?.toolName, options?.render]);
}
