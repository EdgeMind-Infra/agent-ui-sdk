/**
 * Design token color palettes for light and dark themes.
 * All values are CSS-in-JS friendly strings compatible with React Native.
 */

export interface ColorTokens {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  destructive: string;
  destructiveForeground: string;
}

export interface ThemeTokens {
  colors: ColorTokens;
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    full: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    "2xl": number;
  };
  spacing: {
    1: number;
    2: number;
    3: number;
    4: number;
    6: number;
    8: number;
  };
}

const lightColors: ColorTokens = {
  background: "#ffffff",
  foreground: "#09090b",
  primary: "#18181b",
  primaryForeground: "#fafafa",
  secondary: "#f4f4f5",
  secondaryForeground: "#18181b",
  muted: "#f4f4f5",
  mutedForeground: "#71717a",
  accent: "#f4f4f5",
  accentForeground: "#18181b",
  border: "#e4e4e7",
  input: "#e4e4e7",
  destructive: "#ef4444",
  destructiveForeground: "#fafafa",
};

const darkColors: ColorTokens = {
  background: "#09090b",
  foreground: "#fafafa",
  primary: "#fafafa",
  primaryForeground: "#18181b",
  secondary: "#27272a",
  secondaryForeground: "#fafafa",
  muted: "#27272a",
  mutedForeground: "#a1a1aa",
  accent: "#27272a",
  accentForeground: "#fafafa",
  border: "#27272a",
  input: "#27272a",
  destructive: "#7f1d1d",
  destructiveForeground: "#fafafa",
};

const sharedTokens = {
  borderRadius: { sm: 6, md: 8, lg: 12, full: 9999 },
  fontSize: { xs: 10, sm: 12, base: 14, lg: 16, xl: 20, "2xl": 24 },
  spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 },
};

export const lightTheme: ThemeTokens = {
  colors: lightColors,
  ...sharedTokens,
};

export const darkTheme: ThemeTokens = {
  colors: darkColors,
  ...sharedTokens,
};
