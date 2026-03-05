"use client";

import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "src/components/ai-elements/reasoning";
import type { ReasoningPartProps } from "../../types";

export function ReasoningPart({ text, isStreaming }: ReasoningPartProps) {
  return (
    <Reasoning className="w-full" isStreaming={isStreaming}>
      <ReasoningTrigger />
      <ReasoningContent>{text}</ReasoningContent>
    </Reasoning>
  );
}
