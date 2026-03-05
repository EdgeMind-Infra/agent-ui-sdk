"use client";

import { createContext, type ReactNode, useContext, useMemo } from "react";
import { useColorScheme } from "react-native";
import { darkTheme, lightTheme, type ThemeTokens } from "./tokens";

// ─── Context ──────────────────────────────────────────────────────────────

interface ThemeContextValue {
  theme: ThemeTokens;
  colorScheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: lightTheme,
  colorScheme: "light",
});

// ─── ThemeProvider ────────────────────────────────────────────────────────

export interface ThemeProviderProps {
  children: ReactNode;
  /** Force a specific color scheme; if omitted, follows system preference */
  colorScheme?: "light" | "dark";
  /** Partial token overrides merged on top of the resolved theme */
  theme?: Partial<ThemeTokens>;
}

export function ThemeProvider({
  children,
  colorScheme: colorSchemeProp,
  theme: overrides,
}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const resolvedScheme: "light" | "dark" =
    colorSchemeProp ?? (systemColorScheme === "dark" ? "dark" : "light");

  const baseTheme = resolvedScheme === "dark" ? darkTheme : lightTheme;

  const theme = useMemo<ThemeTokens>(
    () =>
      overrides
        ? {
            ...baseTheme,
            ...overrides,
            colors: { ...baseTheme.colors, ...overrides.colors },
          }
        : baseTheme,
    [baseTheme, overrides],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, colorScheme: resolvedScheme }),
    [theme, resolvedScheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// ─── useThemeContext ──────────────────────────────────────────────────────
// (internal hook — use useTheme() from useTheme.ts in public API)

export function useThemeContext(): ThemeContextValue {
  return useContext(ThemeContext);
}
