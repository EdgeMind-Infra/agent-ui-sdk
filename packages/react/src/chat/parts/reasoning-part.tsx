"use client";

import { memo, useCallback, useMemo } from "react";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "src/components/ai-elements/reasoning";
import { Shimmer } from "src/components/ai-elements/shimmer";
import { DEFAULT_CHAT_LABELS, type ReasoningPartProps } from "../../types";
import { useChatStatic } from "../chat-provider";

/** memo: same reasoning as TextPart — long <thinking> blocks run the full markdown pipeline, and
 *  both props are primitives, so unchanged text should not re-render. */
export const ReasoningPart = memo(function ReasoningPart({
  text,
  isStreaming,
}: ReasoningPartProps) {
  const { config } = useChatStatic();
  // Spreading inline would allocate a new object per render and, since the callback below reads
  // from it, recompute `getThinkingMessage` every time — which propagates into ReasoningTrigger.
  const labels = useMemo(() => ({ ...DEFAULT_CHAT_LABELS, ...config.labels }), [config.labels]);

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
    [labels.thinking, labels.thoughtForFewSeconds, labels.thoughtForSeconds],
  );

  return (
    <Reasoning className="w-full" isStreaming={isStreaming}>
      <ReasoningTrigger getThinkingMessage={getThinkingMessage} />
      <ReasoningContent>{text}</ReasoningContent>
    </Reasoning>
  );
});
