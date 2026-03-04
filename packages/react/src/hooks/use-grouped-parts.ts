import { type GroupRule, groupParts, type MessagePart, type PartGroup } from "@agent-ui-sdk/core";
import { useMemo } from "react";

/**
 * Hook that groups message parts using the grouping engine.
 * Memoized to avoid re-computation on every render.
 *
 * @example
 * ```tsx
 * const groups = useGroupedParts(message.parts, [
 *   { key: "tool-group", match: (p) => p.type === "tool-call" },
 *   { key: "reasoning", match: (p) => p.type === "reasoning" },
 *   { key: "sources", match: (p) => p.type === "source" },
 * ]);
 * ```
 */
export function useGroupedParts(parts: MessagePart[], rules: GroupRule[]): PartGroup[] {
  return useMemo(() => groupParts(parts, rules), [parts, rules]);
}
