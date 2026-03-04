import { useMemo } from "react";
import { type AnyUIMessagePart, type GroupRule, groupParts, type PartGroup } from "../../index";

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
export function useGroupedParts(parts: AnyUIMessagePart[], rules: GroupRule[]): PartGroup[] {
  return useMemo(() => groupParts(parts, rules), [parts, rules]);
}
