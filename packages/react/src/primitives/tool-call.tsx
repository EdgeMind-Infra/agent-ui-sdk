/**
 * ToolCall Primitive — Renders tool call parts.
 *
 * Provides:
 * - ToolCall.Root: Context Provider with tool part data
 * - ToolCall.Header: Tool name + 7-state status badge
 * - ToolCall.Content: Collapsible panel for tool details
 * - ToolCall.Input / Output: JSON formatted display
 * - ToolGroup: GroupingEngine-powered "Used N tools" collapsible
 */

import type { AnyUIMessagePart, PartGroup } from "@agent-ui-sdk/core";
import {
  type DynamicToolUIPart,
  getToolName,
  isToolUIPart,
  type ToolCallStatus,
  type ToolUIPart,
  toolStatusIcons,
  toolStatusLabels,
  type UITools,
} from "@agent-ui-sdk/core";
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
// Tool part union type
// ---------------------------------------------------------------------------

type AnyToolPart = DynamicToolUIPart | ToolUIPart<UITools>;

// ---------------------------------------------------------------------------
// ToolCall Context
// ---------------------------------------------------------------------------

interface ToolCallContextValue {
  part: AnyToolPart;
  status: ToolCallStatus;
  statusLabel: string;
  statusIcon: string;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ToolCallContext = createContext<ToolCallContextValue | null>(null);

export function useToolCallContext(): ToolCallContextValue {
  const ctx = useContext(ToolCallContext);
  if (!ctx) throw new Error("useToolCallContext must be used within <ToolCall.Root>");
  return ctx;
}

// ---------------------------------------------------------------------------
// ToolCall.Root
// ---------------------------------------------------------------------------

export interface ToolCallRootProps extends Omit<HTMLAttributes<HTMLDivElement>, "part"> {
  children: ReactNode;
  part: AnyToolPart;
  /** Override computed status */
  status?: ToolCallStatus;
  /** Initial open state */
  defaultOpen?: boolean;
}

export function ToolCallRoot({
  children,
  part,
  status: statusOverride,
  defaultOpen = false,
  ...props
}: ToolCallRootProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const status = statusOverride ?? (part.state as ToolCallStatus);
  const toolName = getToolName(part);

  const ctx: ToolCallContextValue = {
    part,
    status,
    statusLabel: toolStatusLabels[status],
    statusIcon: toolStatusIcons[status],
    isOpen,
    setIsOpen,
  };

  return (
    <ToolCallContext.Provider value={ctx}>
      <div
        data-aui="tool-call-root"
        data-tool-name={toolName}
        data-status={status}
        className="aui-tool-call-root"
        {...props}
      >
        {children}
      </div>
    </ToolCallContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// ToolCall.Header
// ---------------------------------------------------------------------------

export interface ToolCallHeaderProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  /** Render the status badge (receives status info) */
  renderBadge?: (info: { label: string; icon: string; status: ToolCallStatus }) => ReactNode;
}

export function ToolCallHeader({ children, renderBadge, ...props }: ToolCallHeaderProps) {
  const { part, status, statusLabel, statusIcon, isOpen, setIsOpen } = useToolCallContext();
  const toolName = getToolName(part);

  const toggle = useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen]);

  return (
    <button
      type="button"
      data-aui="tool-call-header"
      className="aui-tool-call-header"
      onClick={toggle}
      {...props}
    >
      <span className="aui-tool-call-name">{toolName}</span>
      {renderBadge ? (
        renderBadge({ label: statusLabel, icon: statusIcon, status })
      ) : (
        <span className="aui-tool-call-badge" data-status={status}>
          {statusLabel}
        </span>
      )}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ToolCall.Content
// ---------------------------------------------------------------------------

export interface ToolCallContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function ToolCallContent({ children, ...props }: ToolCallContentProps) {
  const { isOpen } = useToolCallContext();
  if (!isOpen) return null;

  return (
    <div data-aui="tool-call-content" className="aui-tool-call-content" {...props}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToolCall.Input / Output
// ---------------------------------------------------------------------------

export interface ToolCallInputProps extends HTMLAttributes<HTMLPreElement> {}

export function ToolCallInput(props: ToolCallInputProps) {
  const { part } = useToolCallContext();
  const input = "input" in part ? part.input : undefined;

  return (
    <pre data-aui="tool-call-input" className="aui-tool-call-input" {...props}>
      {typeof input === "string" ? input : JSON.stringify(input, null, 2)}
    </pre>
  );
}

export interface ToolCallOutputProps extends HTMLAttributes<HTMLPreElement> {}

export function ToolCallOutput(props: ToolCallOutputProps) {
  const { part, status } = useToolCallContext();

  if (status === "output-error") {
    const errorText = "errorText" in part ? part.errorText : undefined;
    return (
      <pre
        data-aui="tool-call-output"
        data-error="true"
        className="aui-tool-call-output aui-tool-call-error"
        {...props}
      >
        {errorText}
      </pre>
    );
  }

  const output = "output" in part ? part.output : undefined;
  if (output === undefined) return null;

  return (
    <pre data-aui="tool-call-output" className="aui-tool-call-output" {...props}>
      {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
    </pre>
  );
}

// ---------------------------------------------------------------------------
// ToolCall — UIRegistry integration
// ---------------------------------------------------------------------------

export interface ToolCallWithRegistryProps {
  part: AnyToolPart;
  /** Fallback component when no registry match */
  fallback?: ReactNode;
}

export function ToolCallWithRegistry({ part, fallback }: ToolCallWithRegistryProps) {
  const registry = useAgentUI((s) => s.registry);
  const toolName = getToolName(part);
  const registered = registry.getToolUI(toolName);

  if (registered?.render) {
    const Component = registered.render as React.ComponentType<{ part: AnyToolPart }>;
    return <Component part={part} />;
  }

  return <>{fallback}</>;
}

// ---------------------------------------------------------------------------
// ToolGroup — "Used N tools" collapsible
// ---------------------------------------------------------------------------

export interface ToolGroupProps extends HTMLAttributes<HTMLDivElement> {
  group: PartGroup;
  /** Custom label (default: "Used {n} tools") */
  label?: (count: number) => string;
  /** Render each tool part */
  renderTool: (part: AnyToolPart, index: number) => ReactNode;
  /** Initial open state */
  defaultOpen?: boolean;
}

export function ToolGroup({
  group,
  label,
  renderTool,
  defaultOpen = false,
  ...props
}: ToolGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const toolParts = group.parts.filter((p): p is AnyToolPart =>
    isToolUIPart(p as AnyUIMessagePart),
  );
  const count = toolParts.length;

  return (
    <div data-aui="tool-group" className="aui-tool-group" {...props}>
      <button
        type="button"
        data-aui="tool-group-trigger"
        className="aui-tool-group-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        {label ? label(count) : `Used ${count} tool${count !== 1 ? "s" : ""}`}
      </button>
      {isOpen && (
        <div data-aui="tool-group-content" className="aui-tool-group-content">
          {toolParts.map((part, i) => renderTool(part, i))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const ToolCall = {
  Root: ToolCallRoot,
  Header: ToolCallHeader,
  Content: ToolCallContent,
  Input: ToolCallInput,
  Output: ToolCallOutput,
  WithRegistry: ToolCallWithRegistry,
};
