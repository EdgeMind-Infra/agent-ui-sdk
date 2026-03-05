/**
 * Confirmation Primitive — Human-in-the-loop tool approval.
 *
 * Provides:
 * - Confirmation.Root: Context Provider for approval state
 * - Confirmation.Request: Shows only when approval is pending
 * - Confirmation.Accepted: Shows only when approved
 * - Confirmation.Rejected: Shows only when denied
 * - Confirmation.Actions: Approve/deny buttons
 */

import { useAgentUI } from "@agent-ui-sdk/core/react";
import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ApprovalState = "pending" | "approved" | "denied";

// ---------------------------------------------------------------------------
// Confirmation Context
// ---------------------------------------------------------------------------

interface ConfirmationContextValue {
  toolCallId: string;
  toolName: string;
  state: ApprovalState;
  approve: () => void;
  deny: () => void;
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

export function useConfirmationContext(): ConfirmationContextValue {
  const ctx = useContext(ConfirmationContext);
  if (!ctx) throw new Error("useConfirmationContext must be used within <Confirmation.Root>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Confirmation.Root
// ---------------------------------------------------------------------------

export interface ConfirmationRootProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  toolCallId: string;
  toolName: string;
  /** Override approval state */
  state?: ApprovalState;
  /** Called when user approves */
  onApprove?: (toolCallId: string) => void;
  /** Called when user denies */
  onDeny?: (toolCallId: string) => void;
}

export function ConfirmationRoot({
  children,
  toolCallId,
  toolName,
  state: stateProp,
  onApprove,
  onDeny,
  ...props
}: ConfirmationRootProps) {
  const [internalState, setInternalState] = useState<ApprovalState>("pending");
  const state = stateProp ?? internalState;
  const onToolApprovalResponse = useAgentUI((s) => s.actions.onToolApprovalResponse);

  const approve = useCallback(() => {
    setInternalState("approved");
    onApprove?.(toolCallId);
    onToolApprovalResponse?.({ id: toolCallId, approved: true });
  }, [toolCallId, onApprove, onToolApprovalResponse]);

  const deny = useCallback(() => {
    setInternalState("denied");
    onDeny?.(toolCallId);
    onToolApprovalResponse?.({ id: toolCallId, approved: false });
  }, [toolCallId, onDeny, onToolApprovalResponse]);

  const ctx: ConfirmationContextValue = { toolCallId, toolName, state, approve, deny };

  return (
    <ConfirmationContext.Provider value={ctx}>
      <div
        data-aui="confirmation-root"
        data-state={state}
        className="aui-confirmation-root"
        {...props}
      >
        {children}
      </div>
    </ConfirmationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Conditional child components
// ---------------------------------------------------------------------------

export interface ConfirmationConditionalProps {
  children: ReactNode;
}

export function ConfirmationRequest({ children }: ConfirmationConditionalProps) {
  const { state } = useConfirmationContext();
  if (state !== "pending") return null;
  return <>{children}</>;
}

export function ConfirmationAccepted({ children }: ConfirmationConditionalProps) {
  const { state } = useConfirmationContext();
  if (state !== "approved") return null;
  return <>{children}</>;
}

export function ConfirmationRejected({ children }: ConfirmationConditionalProps) {
  const { state } = useConfirmationContext();
  if (state !== "denied") return null;
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Confirmation.Actions
// ---------------------------------------------------------------------------

export interface ConfirmationActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** Custom approve button label */
  approveLabel?: ReactNode;
  /** Custom deny button label */
  denyLabel?: ReactNode;
}

export function ConfirmationActions({
  approveLabel,
  denyLabel,
  ...props
}: ConfirmationActionsProps) {
  const { state, approve, deny } = useConfirmationContext();

  if (state !== "pending") return null;

  return (
    <div data-aui="confirmation-actions" className="aui-confirmation-actions" {...props}>
      <button
        type="button"
        data-aui="confirmation-approve"
        className="aui-confirmation-approve"
        onClick={approve}
      >
        {approveLabel ?? "Approve"}
      </button>
      <button
        type="button"
        data-aui="confirmation-deny"
        className="aui-confirmation-deny"
        onClick={deny}
      >
        {denyLabel ?? "Deny"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Confirmation = {
  Root: ConfirmationRoot,
  Request: ConfirmationRequest,
  Accepted: ConfirmationAccepted,
  Rejected: ConfirmationRejected,
  Actions: ConfirmationActions,
};
