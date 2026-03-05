import { useThemeContext } from "./ThemeProvider";
import type { ThemeTokens } from "./tokens";

/**
 * Returns the current theme tokens and color scheme.
 *
 * Must be used inside a <ThemeProvider> (or the default context is used).
 */
export function useTheme(): ThemeTokens & { colorScheme: "light" | "dark" } {
  const { theme, colorScheme } = useThemeContext();
  return { ...theme, colorScheme };
}
