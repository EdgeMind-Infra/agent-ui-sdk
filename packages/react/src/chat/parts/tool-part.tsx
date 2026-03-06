"use client";

import { MessageResponse } from "src/components/ai-elements/message";
import {
  Tool,
  ToolApproval,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "src/components/ai-elements/tool";
import type { ToolPartProps } from "../../types";

export function ToolPart({ part, addToolApprovalResponse }: ToolPartProps) {
  const isCompleted = part.state === "output-available";
  const state = part.state as
    | "input-streaming"
    | "input-available"
    | "approval-requested"
    | "approval-responded"
    | "output-available"
    | "output-denied"
    | "output-error";

  return (
    <Tool
      defaultOpen={
        isCompleted ||
        part.state === "output-error" ||
        part.state === "approval-requested"
      }
    >
      {part.type === "dynamic-tool" ? (
        <ToolHeader
          type="dynamic-tool"
          state={state}
          toolName={part.toolName ?? "unknown"}
        />
      ) : (
        <ToolHeader type={part.type as `tool-${string}`} state={state} />
      )}
      {(state === "approval-requested" || state === "approval-responded") &&
        addToolApprovalResponse && (
          <ToolApproval
            approval={part.approval ?? { id: part.toolCallId }}
            state={state}
            onRespond={addToolApprovalResponse}
          />
        )}
      <ToolContent>
        <ToolInput input={part.input} />
        {(part.output || part.errorText) && (
          <ToolOutput
            output={
              part.output ? (
                <MessageResponse>
                  {typeof part.output === "string"
                    ? part.output
                    : JSON.stringify(part.output, null, 2)}
                </MessageResponse>
              ) : undefined
            }
            errorText={part.errorText}
          />
        )}
      </ToolContent>
    </Tool>
  );
}
