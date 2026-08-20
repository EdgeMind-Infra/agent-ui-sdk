"use client";

import { memo } from "react";
import { MessageResponse } from "src/components/ai-elements/message";
import type { TextPartProps } from "../../types";

/** memo：markdown 渲染是消息列表里最贵的一环，props 全是原始值，文本没变就不该重跑。 */
export const TextPart = memo(function TextPart({ text, messageId, partIndex }: TextPartProps) {
  return <MessageResponse key={`${messageId}-text-${partIndex}`}>{text}</MessageResponse>;
});
