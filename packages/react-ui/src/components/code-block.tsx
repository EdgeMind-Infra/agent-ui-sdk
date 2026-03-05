"use client";

import { CodeBlock as CodeBlockPrimitive } from "@agent-ui-sdk/react";
import { CheckIcon, CopyIcon } from "lucide-react";
import type { FC } from "react";
import { cn } from "@/lib/utils";

// ─── CodeBlock ────────────────────────────────────────────────────────────

export interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export const CodeBlock: FC<CodeBlockProps> = ({
  code,
  language = "text",
  showLineNumbers = false,
  className,
}) => (
  <CodeBlockPrimitive.Container
    code={code}
    language={language}
    className={cn("overflow-hidden rounded-xl border border-[var(--aui-border)]", className)}
  >
    {/* Header: language label + copy button */}
    <CodeBlockPrimitive.Header className="flex items-center justify-between border-b border-[var(--aui-border)] bg-[var(--aui-muted)] px-4 py-1.5">
      <span className="font-mono text-xs lowercase text-[var(--aui-muted-foreground)]">
        {language}
      </span>
      <CodeBlockPrimitive.CopyButton
        className="inline-flex size-6 items-center justify-center rounded-md text-[var(--aui-muted-foreground)] transition-colors hover:bg-[var(--aui-accent)] hover:text-[var(--aui-foreground)]"
        copiedChildren={<CheckIcon className="size-3.5 text-emerald-500" />}
      >
        <CopyIcon className="size-3.5" />
      </CodeBlockPrimitive.CopyButton>
    </CodeBlockPrimitive.Header>

    {/* Code content */}
    <CodeBlockPrimitive.Content
      showLineNumbers={showLineNumbers}
      className="overflow-x-auto bg-[var(--aui-background)] p-4 text-sm"
    />
  </CodeBlockPrimitive.Container>
);
