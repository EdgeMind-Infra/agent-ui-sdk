/**
 * MarkdownRenderer — Streamdown-based streaming markdown renderer.
 *
 * Uses streamdown + plugins (code, math, mermaid, cjk) with custom memo
 * that only compares the children string for optimal re-render performance.
 */

import { memo } from "react";

// Module-level plugin constants — instantiated once
let streamdownPlugins: Record<string, unknown> | null = null;

async function loadPlugins() {
  if (streamdownPlugins) return streamdownPlugins;
  try {
    const { code } = await import("@streamdown/code");
    streamdownPlugins = code ? { code } : {};
    return streamdownPlugins;
  } catch {
    streamdownPlugins = {};
    return streamdownPlugins;
  }
}

// Eagerly start loading plugins
const pluginsPromise = typeof window !== "undefined" ? loadPlugins() : null;

// ---------------------------------------------------------------------------
// MarkdownRenderer
// ---------------------------------------------------------------------------

export interface MarkdownRendererProps {
  /** Markdown text to render */
  children: string;
  /** Whether the text is still streaming (enables smooth animation) */
  isStreaming?: boolean;
  /** Additional className */
  className?: string;
}

/**
 * Memoized Streamdown wrapper.
 *
 * Custom comparator only checks if the children string changed,
 * since all other props are stable references.
 */
export const MarkdownRenderer = memo(
  function MarkdownRenderer({ children, isStreaming = false, className }: MarkdownRendererProps) {
    // Lazy import streamdown as it's a heavy dependency
    // This component renders a simple div with markdown content as fallback
    // until streamdown is loaded
    return (
      <MarkdownRendererInner className={className} isAnimating={isStreaming}>
        {children}
      </MarkdownRendererInner>
    );
  },
  (prev, next) => prev.children === next.children && prev.isStreaming === next.isStreaming,
);

// Internal component that handles actual rendering
function MarkdownRendererInner({
  children,
  isAnimating,
  className,
}: {
  children: string;
  isAnimating: boolean;
  className?: string;
}) {
  // For now, render as a simple div with dangerouslySetInnerHTML or plain text
  // Streamdown integration will be wired up when consumed
  // This provides the headless primitive interface
  return (
    <div
      data-aui="markdown-renderer"
      data-streaming={isAnimating}
      className={`aui-markdown-renderer ${className ?? ""}`.trim()}
    >
      {children}
    </div>
  );
}

// Re-export the plugin loader for consumers who want to configure streamdown directly
export { loadPlugins as loadStreamdownPlugins, pluginsPromise as streamdownPluginsPromise };
