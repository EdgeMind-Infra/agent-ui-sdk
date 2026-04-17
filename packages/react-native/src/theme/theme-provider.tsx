import { createContext, useContext, useMemo } from "react";
import { useColorScheme, View } from "react-native";
import { type ColorTokens, darkColors, lightColors } from "./colors";

export type ThemeMode = "auto" | "light" | "dark";

export interface ThemeProviderProps {
  /** Theme mode. "auto" follows device setting. Default: "auto" */
  mode?: ThemeMode;
  /** Override specific color tokens */
  theme?: Partial<ColorTokens>;
  children: React.ReactNode;
}

interface ThemeContextValue {
  mode: "light" | "dark";
  colors: ColorTokens;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  colors: lightColors,
});

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Build NativeWind CSS variable style from color tokens.
 * Maps each token to a CSS variable: `--background`, `--foreground`, etc.
 */
function buildCssVarStyle(colors: ColorTokens): Record<string, string> {
  const style: Record<string, string> = {};
  for (const [key, value] of Object.entries(colors)) {
    style[`--${key}`] = value;
  }
  return style;
}

export function ThemeProvider({ mode = "auto", theme, children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const resolvedMode = mode === "auto" ? (systemScheme === "dark" ? "dark" : "light") : mode;
  const baseColors = resolvedMode === "dark" ? darkColors : lightColors;

  const colors = useMemo(() => {
    if (!theme) return baseColors;
    return { ...baseColors, ...theme };
  }, [baseColors, theme]);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({ mode: resolvedMode, colors }),
    [resolvedMode, colors],
  );

  const cssVarStyle = useMemo(() => buildCssVarStyle(colors), [colors]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <View className="flex-1" style={cssVarStyle as never}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}
