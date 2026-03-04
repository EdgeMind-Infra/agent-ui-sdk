/**
 * ToolCallState — 7 AI SDK tool states with status labels and icons.
 *
 * Maps AI SDK v6 tool part states to human-readable labels and icon names.
 * Platform-agnostic — consumers render actual icons based on these identifiers.
 */

/** All possible tool call states from AI SDK v6 */
export type ToolCallStatus =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-denied"
  | "output-error";

/** Human-readable label for each tool state */
export const toolStatusLabels: Record<ToolCallStatus, string> = {
  "input-streaming": "Running",
  "input-available": "Pending",
  "approval-requested": "Approval Required",
  "approval-responded": "Approved",
  "output-available": "Completed",
  "output-denied": "Denied",
  "output-error": "Error",
};

/** Icon identifier for each tool state (consumers map these to actual icons) */
export const toolStatusIcons: Record<ToolCallStatus, string> = {
  "input-streaming": "loader",
  "input-available": "circle-dashed",
  "approval-requested": "shield-question",
  "approval-responded": "shield-check",
  "output-available": "circle-check",
  "output-denied": "circle-x",
  "output-error": "triangle-alert",
};

/** Check if a tool call is in a terminal state */
export function isToolCallTerminal(status: ToolCallStatus): boolean {
  return status === "output-available" || status === "output-denied" || status === "output-error";
}

/** Check if a tool call requires user approval */
export function isToolCallPendingApproval(status: ToolCallStatus): boolean {
  return status === "approval-requested";
}
