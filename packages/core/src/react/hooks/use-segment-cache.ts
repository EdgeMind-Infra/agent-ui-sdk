import { useMemo } from "react";
import type { AnyUIMessage, GroupRule, PartGroup } from "../../index";
import { groupParts } from "../../index";

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
export function useSegmentCache(rules: GroupRule[]): (message: AnyUIMessage) => PartGroup[] {
  const cache = useMemo(() => new WeakMap<AnyUIMessage, PartGroup[]>(), []);

  return useMemo(
    () => (message: AnyUIMessage) => {
      const cached = cache.get(message);
      if (cached) return cached;
      const groups = groupParts(message.parts, rules);
      cache.set(message, groups);
      return groups;
    },
    [cache, rules],
  );
}
