/**
 * ToolCall Primitive (React Native) — Renders tool call parts.
 *
 * - ToolCall.Root: Context Provider with tool part data + 7-state status
 * - ToolCall.Header: Pressable tool name + status badge
 * - ToolCall.Content: Collapsible panel
 * - ToolCall.Input / Output: JSON formatted Text
 * - ToolCall.WithRegistry: UIRegistry lookup with fallback
 * - ToolGroup: "Used N tools" collapsible
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
  type ComponentType,
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { Pressable, type StyleProp, Text, View, type ViewStyle } from "react-native";

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

export interface ToolCallRootProps {
  children: ReactNode;
  part: AnyToolPart;
  status?: ToolCallStatus;
  defaultOpen?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ToolCallRoot({
  children,
  part,
  status: statusOverride,
  defaultOpen = false,
  style,
}: ToolCallRootProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const status = statusOverride ?? (part.state as ToolCallStatus);

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
      <View style={style} testID="aui-tool-call-root">
        {children}
      </View>
    </ToolCallContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// ToolCall.Header
// ---------------------------------------------------------------------------

export interface ToolCallHeaderProps {
  children?: ReactNode;
  renderBadge?: (info: { label: string; icon: string; status: ToolCallStatus }) => ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ToolCallHeader({ children, renderBadge, style }: ToolCallHeaderProps) {
  const { part, status, statusLabel, statusIcon, isOpen, setIsOpen } = useToolCallContext();
  const toolName = getToolName(part);
  const toggle = useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen]);

  return (
    <Pressable
      onPress={toggle}
      style={style}
      testID="aui-tool-call-header"
      accessibilityRole="button"
      accessibilityLabel={`${toolName}: ${statusLabel}`}
    >
      <Text>{toolName}</Text>
      {renderBadge ? (
        renderBadge({ label: statusLabel, icon: statusIcon, status })
      ) : (
        <Text>{statusLabel}</Text>
      )}
      {children}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// ToolCall.Content
// ---------------------------------------------------------------------------

export interface ToolCallContentProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ToolCallContent({ children, style }: ToolCallContentProps) {
  const { isOpen } = useToolCallContext();
  if (!isOpen) return null;

  return (
    <View style={style} testID="aui-tool-call-content">
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ToolCall.Input / Output
// ---------------------------------------------------------------------------

export interface ToolCallIOProps {
  style?: StyleProp<ViewStyle>;
}

export function ToolCallInput({ style }: ToolCallIOProps) {
  const { part } = useToolCallContext();
  const input = "input" in part ? part.input : undefined;

  return (
    <Text style={style} testID="aui-tool-call-input" selectable>
      {typeof input === "string" ? input : JSON.stringify(input, null, 2)}
    </Text>
  );
}

export function ToolCallOutput({ style }: ToolCallIOProps) {
  const { part, status } = useToolCallContext();

  if (status === "output-error") {
    const errorText = "errorText" in part ? part.errorText : undefined;
    return (
      <Text style={style} testID="aui-tool-call-output" selectable>
        {errorText}
      </Text>
    );
  }

  const output = "output" in part ? part.output : undefined;
  if (output === undefined) return null;

  return (
    <Text style={style} testID="aui-tool-call-output" selectable>
      {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// ToolCall.WithRegistry
// ---------------------------------------------------------------------------

export interface ToolCallWithRegistryProps {
  part: AnyToolPart;
  fallback?: ReactNode;
}

export function ToolCallWithRegistry({ part, fallback }: ToolCallWithRegistryProps) {
  const registry = useAgentUI((s) => s.registry);
  const toolName = getToolName(part);
  const registered = registry.getToolUI(toolName);

  if (registered?.render) {
    const Component = registered.render as ComponentType<{ part: AnyToolPart }>;
    return <Component part={part} />;
  }

  return <>{fallback}</>;
}

// ---------------------------------------------------------------------------
// ToolGroup
// ---------------------------------------------------------------------------

export interface ToolGroupProps {
  group: PartGroup;
  label?: (count: number) => string;
  renderTool: (part: AnyToolPart, index: number) => ReactNode;
  defaultOpen?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ToolGroup({
  group,
  label,
  renderTool,
  defaultOpen = false,
  style,
}: ToolGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const toolParts = group.parts.filter((p): p is AnyToolPart =>
    isToolUIPart(p as AnyUIMessagePart),
  );
  const count = toolParts.length;

  return (
    <View style={style} testID="aui-tool-group">
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        testID="aui-tool-group-trigger"
        accessibilityRole="button"
      >
        <Text>{label ? label(count) : `Used ${count} tool${count !== 1 ? "s" : ""}`}</Text>
      </Pressable>
      {isOpen && toolParts.map((part, i) => renderTool(part, i))}
    </View>
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
