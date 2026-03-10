"use client";

import { useCallback } from "react";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "src/components/ai-elements/reasoning";
import { Shimmer } from "src/components/ai-elements/shimmer";
import { DEFAULT_CHAT_LABELS, type ReasoningPartProps } from "../../types";
import { useChatContext } from "../chat-provider";

export function ReasoningPart({ text, isStreaming }: ReasoningPartProps) {
  const { config } = useChatContext();
  const labels = { ...DEFAULT_CHAT_LABELS, ...config.labels };

  const getThinkingMessage = useCallback(
    (streaming: boolean, duration?: number) => {
      if (streaming || duration === 0) {
        return <Shimmer duration={1}>{labels.thinking}</Shimmer>;
      }
      if (duration === undefined) {
        return <p>{labels.thoughtForFewSeconds}</p>;
      }
      return <p>{labels.thoughtForSeconds(duration)}</p>;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [labels.thinking, labels.thoughtForFewSeconds, labels.thoughtForSeconds],
  );

  return (
    <Reasoning className="w-full" isStreaming={isStreaming}>
      <ReasoningTrigger getThinkingMessage={getThinkingMessage} />
      <ReasoningContent>{text}</ReasoningContent>
    </Reasoning>
  );
}
