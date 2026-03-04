/**
 * Part Grouping Engine — declarative message part grouping.
 *
 * Instead of hand-writing segment accumulation logic in the renderer,
 * define rules declaratively and let the engine do the grouping.
 */

import type { AnyUIMessagePart } from "./types";

/** A rule that defines how to group consecutive matching parts */
export interface GroupRule {
  /** Unique key for this group type */
  key: string;
  /** Predicate: does this part belong to this group? */
  match: (part: AnyUIMessagePart, index: number, parts: AnyUIMessagePart[]) => boolean;
}

/** A group of consecutive parts that matched the same rule */
export interface PartGroup {
  /** The group rule key */
  key: string;
  /** The grouped parts */
  parts: AnyUIMessagePart[];
  /** Start index in the original parts array */
  startIndex: number;
  /** End index (exclusive) in the original parts array */
  endIndex: number;
}

/** Default group key for parts that don't match any rule */
const UNGROUPED_KEY = "__ungrouped__";

/**
 * Group consecutive message parts by matching rules.
 *
 * Parts that match the same rule and are consecutive will be merged
 * into a single PartGroup. Parts that don't match any rule get
 * their own group with key "__ungrouped__".
 *
 * @example
 * ```ts
 * const rules: GroupRule[] = [
 *   { key: "tool-group", match: (p) => p.type === "tool-call" },
 *   { key: "reasoning", match: (p) => p.type === "reasoning" },
 *   { key: "sources", match: (p) => p.type === "source" },
 * ];
 *
 * const groups = groupParts(message.parts, rules);
 * // [{ key: "reasoning", parts: [...] }, { key: "__ungrouped__", parts: [textPart] }, ...]
 * ```
 */
export function groupParts(parts: AnyUIMessagePart[], rules: GroupRule[]): PartGroup[] {
  if (parts.length === 0) return [];

  const groups: PartGroup[] = [];
  let currentKey: string | null = null;
  let currentParts: AnyUIMessagePart[] = [];
  let currentStart = 0;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]!;

    // Find the first matching rule
    let matchedKey = UNGROUPED_KEY;
    for (const rule of rules) {
      if (rule.match(part, i, parts)) {
        matchedKey = rule.key;
        break;
      }
    }

    if (matchedKey === currentKey) {
      // Continue accumulating into current group
      currentParts.push(part);
    } else {
      // Flush current group
      if (currentKey !== null && currentParts.length > 0) {
        groups.push({
          key: currentKey,
          parts: currentParts,
          startIndex: currentStart,
          endIndex: i,
        });
      }
      // Start new group
      currentKey = matchedKey;
      currentParts = [part];
      currentStart = i;
    }
  }

  // Flush last group
  if (currentKey !== null && currentParts.length > 0) {
    groups.push({
      key: currentKey,
      parts: currentParts,
      startIndex: currentStart,
      endIndex: parts.length,
    });
  }

  return groups;
}
