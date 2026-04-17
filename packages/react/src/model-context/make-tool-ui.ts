"use client";

import type { FC } from "react";
import { type UseToolUIOptions, useToolUI } from "../hooks/use-tool-ui";

export type ToolUIComponent = FC & {
  /** @internal Tool registration metadata. */
  _toolUI: UseToolUIOptions<any, any>;
};

/**
 * Create a "invisible component" that registers a per-tool renderer when mounted.
 *
 * The returned component renders `null` — its only purpose is to register
 * the tool UI via React's component lifecycle (mount = register, unmount = unregister).
 *
 * @example
 * ```tsx
 * const SearchToolUI = makeToolUI<{ query: string }, { results: Item[] }>({
 *   toolName: "web_search",
 *   render: ({ input, output, state }) => (
 *     <SearchCard query={input?.query} results={output?.results} />
 *   ),
 * });
 *
 * // Place in React tree to register:
 * function App() {
 *   return (
 *     <Chat chatHelpers={chat}>
 *       <SearchToolUI />
 *     </Chat>
 *   );
 * }
 * ```
 */
export function makeToolUI<TArgs = unknown, TResult = unknown>(
  options: UseToolUIOptions<TArgs, TResult>,
): ToolUIComponent {
  const ToolUI: ToolUIComponent = () => {
    useToolUI(options);
    return null;
  };
  ToolUI._toolUI = options as UseToolUIOptions<TArgs, TResult>;
  ToolUI.displayName = `ToolUI(${options.toolName})`;
  return ToolUI;
}
