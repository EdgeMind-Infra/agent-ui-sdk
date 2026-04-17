"use client";

import type { HTMLAttributes } from "react";
import { cn } from "src/lib/utils";

export type DictationTranscriptProps = HTMLAttributes<HTMLSpanElement> & {
  transcript: string;
};

export function DictationTranscript({ transcript, className, ...props }: DictationTranscriptProps) {
  if (!transcript) return null;

  return (
    <span className={cn("text-sm italic text-muted-foreground", className)} {...props}>
      {transcript}
    </span>
  );
}
