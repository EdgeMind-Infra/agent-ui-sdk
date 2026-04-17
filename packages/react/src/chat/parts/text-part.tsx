"use client";

import { MessageResponse } from "src/components/ai-elements/message";
import type { TextPartProps } from "../../types";

export function TextPart({ text, messageId, partIndex }: TextPartProps) {
  return <MessageResponse key={`${messageId}-text-${partIndex}`}>{text}</MessageResponse>;
}
