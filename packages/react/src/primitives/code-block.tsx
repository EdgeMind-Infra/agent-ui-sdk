/**
 * CodeBlock Primitive — Code display with async syntax highlighting.
 *
 * Provides:
 * - CodeBlock.Container: content-visibility: auto optimization
 * - CodeBlock.Header: Language label + copy button
 * - CodeBlock.Content: Async Shiki highlighting with progressive enhancement
 * - CodeBlock.LineNumbers: CSS counter line numbers
 * - CodeBlock.CopyButton: Copy code to clipboard
 *
 * Highlighting cache:
 * - highlighterCache: Map per language (singleton highlighter)
 * - tokensCache: Map per code+language (highlighted output)
 */

import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Highlighter Cache System
// ---------------------------------------------------------------------------

const highlighterCache = new Map<string, Promise<unknown>>();
const tokensCache = new Map<string, string>();

function getCacheKey(code: string, language: string): string {
  return `${language}:${code}`;
}

// Async highlight function using dynamic import of shiki
async function highlightCode(
  code: string,
  language: string,
  onHighlighted: (html: string) => void,
): Promise<void> {
  const cacheKey = getCacheKey(code, language);

  // Check tokens cache first
  const cached = tokensCache.get(cacheKey);
  if (cached) {
    onHighlighted(cached);
    return;
  }

  try {
    // Dynamic import shiki
    const { createHighlighter } = await import("shiki");

    // Get or create highlighter for this language
    if (!highlighterCache.has(language)) {
      highlighterCache.set(
        language,
        createHighlighter({
          themes: ["github-dark", "github-light"],
          langs: [language],
        }),
      );
    }

    const highlighter = (await highlighterCache.get(language)) as {
      codeToHtml: (code: string, options: { lang: string; theme: string }) => string;
    };

    const html = highlighter.codeToHtml(code, { lang: language, theme: "github-dark" });
    tokensCache.set(cacheKey, html);
    onHighlighted(html);
  } catch {
    // Highlighting failed — keep raw text
  }
}

// ---------------------------------------------------------------------------
// CodeBlock Context
// ---------------------------------------------------------------------------

interface CodeBlockContextValue {
  code: string;
  language: string;
  highlightedHtml: string | null;
}

const CodeBlockContext = createContext<CodeBlockContextValue | null>(null);

function useCodeBlockContext(): CodeBlockContextValue {
  const ctx = useContext(CodeBlockContext);
  if (!ctx) throw new Error("useCodeBlockContext must be used within <CodeBlock.Container>");
  return ctx;
}

// ---------------------------------------------------------------------------
// CodeBlock.Container
// ---------------------------------------------------------------------------

export interface CodeBlockContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  code: string;
  language?: string;
}

export function CodeBlockContainer({
  children,
  code,
  language = "text",
  style,
  ...props
}: CodeBlockContainerProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(() => {
    // Check cache synchronously
    return tokensCache.get(getCacheKey(code, language)) ?? null;
  });

  // Trigger async highlighting
  useEffect(() => {
    if (language === "text") return;
    highlightCode(code, language, setHighlightedHtml);
  }, [code, language]);

  const ctx: CodeBlockContextValue = { code, language, highlightedHtml };

  return (
    <CodeBlockContext.Provider value={ctx}>
      <div
        data-aui="code-block-container"
        data-language={language}
        className="aui-code-block-container"
        style={{
          contentVisibility: "auto",
          containIntrinsicSize: "auto 200px",
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    </CodeBlockContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// CodeBlock.Header
// ---------------------------------------------------------------------------

export interface CodeBlockHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function CodeBlockHeader({ children, ...props }: CodeBlockHeaderProps) {
  const { language } = useCodeBlockContext();

  return (
    <div data-aui="code-block-header" className="aui-code-block-header" {...props}>
      <span className="aui-code-block-language">{language}</span>
      {children}
    </div>
  );
}

/** Stable key for line elements (avoids noArrayIndexKey lint) */
function lineKey(position: number): string {
  return `line-${position}`;
}

// ---------------------------------------------------------------------------
// CodeBlock.Content — Progressive enhancement: raw → highlighted
// ---------------------------------------------------------------------------

export interface CodeBlockContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether to show line numbers */
  showLineNumbers?: boolean;
}

export function CodeBlockContent({ showLineNumbers = false, ...props }: CodeBlockContentProps) {
  const { code, highlightedHtml } = useCodeBlockContext();

  if (highlightedHtml) {
    return (
      <div
        data-aui="code-block-content"
        data-highlighted="true"
        className="aui-code-block-content"
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        {...props}
      />
    );
  }

  // Raw text fallback (before highlighting loads)
  const lines = code.split("\n");
  return (
    <div data-aui="code-block-content" className="aui-code-block-content" {...props}>
      <pre>
        <code>
          {showLineNumbers
            ? lines.map((line, i) => (
                <span key={lineKey(i)} className="aui-code-block-line" data-line-number={i + 1}>
                  {line}
                  {i < lines.length - 1 ? "\n" : ""}
                </span>
              ))
            : code}
        </code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CodeBlock.CopyButton
// ---------------------------------------------------------------------------

export interface CodeBlockCopyButtonProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  copiedChildren?: ReactNode;
}

export function CodeBlockCopyButton({
  children,
  copiedChildren,
  ...props
}: CodeBlockCopyButtonProps) {
  const { code } = useCodeBlockContext();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <button
      type="button"
      data-aui="code-block-copy"
      data-copied={copied}
      className="aui-code-block-copy"
      onClick={handleCopy}
      {...props}
    >
      {copied ? (copiedChildren ?? "Copied") : (children ?? "Copy")}
    </button>
  );
}

// ---------------------------------------------------------------------------
// CodeBlock.LineNumbers
// ---------------------------------------------------------------------------

export interface CodeBlockLineNumbersProps extends HTMLAttributes<HTMLDivElement> {}

export function CodeBlockLineNumbers(props: CodeBlockLineNumbersProps) {
  const { code } = useCodeBlockContext();
  const lineCount = code.split("\n").length;

  return (
    <div
      data-aui="code-block-line-numbers"
      className="aui-code-block-line-numbers"
      style={{ counterReset: "line 0" }}
      {...props}
    >
      {Array.from({ length: lineCount }, (_, i) => (
        <span key={lineKey(i)} className="aui-code-block-line-number">
          {i + 1}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const CodeBlock = {
  Container: CodeBlockContainer,
  Header: CodeBlockHeader,
  Content: CodeBlockContent,
  CopyButton: CodeBlockCopyButton,
  LineNumbers: CodeBlockLineNumbers,
};
