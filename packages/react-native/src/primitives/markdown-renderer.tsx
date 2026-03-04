/**
 * MarkdownRenderer Primitive (React Native) — Renders markdown text.
 *
 * Provides a headless wrapper — consumers provide their own markdown renderer
 * (e.g., react-native-markdown-display, react-native-marked, etc.).
 *
 * If no renderMarkdown is provided, falls back to plain Text.
 */

import { memo, type ReactNode } from "react";
import { type StyleProp, Text, type TextStyle } from "react-native";

export interface MarkdownRendererProps {
  /** Markdown source text */
  children: string;
  /** Whether content is still streaming */
  isStreaming?: boolean;
  /** Custom markdown renderer */
  renderMarkdown?: (text: string, isStreaming: boolean) => ReactNode;
  /** Style for the fallback Text element */
  style?: StyleProp<TextStyle>;
}

/**
 * Headless markdown renderer.
 * Consumers inject their own rendering via `renderMarkdown`.
 * Falls back to plain Text if no renderer is provided.
 */
export const MarkdownRenderer = memo(
  function MarkdownRenderer({
    children,
    isStreaming = false,
    renderMarkdown,
    style,
  }: MarkdownRendererProps) {
    if (renderMarkdown) {
      return <>{renderMarkdown(children, isStreaming)}</>;
    }

    return (
      <Text style={style} selectable testID="aui-markdown-renderer">
        {children}
      </Text>
    );
  },
  (prev, next) => prev.children === next.children && prev.isStreaming === next.isStreaming,
);
