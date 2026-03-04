import type { BaseMessage, GroupRule, PartGroup } from "@agent-ui-sdk/core";
import { groupParts } from "@agent-ui-sdk/core";
import { useMemo } from "react";

/**
 * WeakMap-based cache for message segment computation.
 * Avoids re-computing groups when the message object reference hasn't changed.
 *
 * @example
 * ```tsx
 * const getSegments = useSegmentCache(rules);
 * // In your message list:
 * const groups = getSegments(message);
 * ```
 */
export function useSegmentCache(rules: GroupRule[]): (message: BaseMessage) => PartGroup[] {
  const cache = useMemo(() => new WeakMap<BaseMessage, PartGroup[]>(), []);

  return useMemo(
    () => (message: BaseMessage) => {
      const cached = cache.get(message);
      if (cached) return cached;
      const groups = groupParts(message.parts, rules);
      cache.set(message, groups);
      return groups;
    },
    [cache, rules],
  );
}
