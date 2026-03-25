import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Lightweight class concatenation for module-level initialization (e.g. inside `cva()` calls).
 * Unlike `cn()`, this does NOT call `twMerge`, avoiding deep stack frames that
 * cause "Maximum call stack size exceeded" on JSC when many modules load at once.
 *
 * Safe to use when inputs are non-conflicting class strings (e.g. base + Platform.select).
 */
export function staticCn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(" ");
}
