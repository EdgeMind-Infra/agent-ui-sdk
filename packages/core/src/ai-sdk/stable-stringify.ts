/**
 * stableStringifyToolArgs — Stable JSON serialization for streaming tool args.
 *
 * During streaming, tool call args may arrive with keys in different orders.
 * This function maintains a consistent key order (first-seen) to prevent
 * unnecessary re-renders when the serialized output is used as a React key or
 * dependency.
 */

/** WeakMap cache: object → stable JSON string */
const stableCache = new WeakMap<object, string>();

/** Track first-seen key order per tool call */
const keyOrderCache = new WeakMap<object, string[]>();

/**
 * Serialize tool args to a stable JSON string.
 * Keys are sorted in first-seen order, cached via WeakMap.
 */
export function stableStringifyToolArgs(args: unknown): string {
  if (args === null || args === undefined) return "null";
  if (typeof args !== "object") return JSON.stringify(args);

  const obj = args as Record<string, unknown>;

  // Check cache
  const cached = stableCache.get(obj);
  if (cached) return cached;

  // Get or create stable key order
  let keyOrder = keyOrderCache.get(obj);
  if (!keyOrder) {
    keyOrder = Object.keys(obj).sort();
    keyOrderCache.set(obj, keyOrder);
  } else {
    // Merge any new keys (streaming may add keys over time)
    const currentKeys = Object.keys(obj);
    for (const key of currentKeys) {
      if (!keyOrder.includes(key)) {
        keyOrder.push(key);
      }
    }
  }

  // Build ordered object
  const ordered: Record<string, unknown> = {};
  for (const key of keyOrder) {
    if (key in obj) {
      ordered[key] = obj[key];
    }
  }

  const result = JSON.stringify(ordered);
  stableCache.set(obj, result);
  return result;
}
