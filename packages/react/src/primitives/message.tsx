/**
 * Message Primitive — Renders a single message in the thread.
 *
 * Provides:
 * - Message.Root: Context Provider, outputs data-role/data-status attributes
 * - Message.If: Conditional render by role
 * - Message.Parts: Iterates parts with component mapping + UIRegistry lookup
 */

import type {
  AnyUIMessage,
  AnyUIMessagePart,
  DynamicToolUIPart,
  ToolUIPart,
  UITools,
} from "@agent-ui-sdk/core";
import {
  type GroupRule,
  getDataPartName,
  getToolName,
  groupParts,
  isDataUIPart,
  isToolUIPart,
  type PartGroup,
} from "@agent-ui-sdk/core";
import { useAgentUI } from "@agent-ui-sdk/core/react";
import {
  type ComponentType,
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useContext,
  useMemo,
} from "react";

// ---------------------------------------------------------------------------
// Message Context
// ---------------------------------------------------------------------------

interface MessageContextValue {
  message: AnyUIMessage;
  /** Whether this message is the last one in the thread */
  isLast: boolean;
  /** Index in the message list */
  index: number;
  /** Status: "complete" | "streaming" | "error" */
  status: string;
}

const MessageContext = createContext<MessageContextValue | null>(null);

export function useMessageContext(): MessageContextValue {
  const ctx = useContext(MessageContext);
  if (!ctx) throw new Error("useMessageContext must be used within <Message.Root>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Message.Root
// ---------------------------------------------------------------------------

export interface MessageRootProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  message: AnyUIMessage;
  /** Index in the thread */
  index?: number;
  /** Whether this is the last message */
  isLast?: boolean;
  /** Override status */
  status?: string;
}

export function MessageRoot({
  children,
  message,
  index = 0,
  isLast = false,
  status: statusOverride,
  ...divProps
}: MessageRootProps) {
  const status = statusOverride ?? "complete";

  const ctx: MessageContextValue = useMemo(
    () => ({ message, isLast, index, status }),
    [message, isLast, index, status],
  );

  return (
    <MessageContext.Provider value={ctx}>
      <div
        data-aui="message-root"
        data-role={message.role}
        data-status={status}
        className={`aui-message-root aui-message-${message.role}`}
        {...divProps}
      >
        {children}
      </div>
    </MessageContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Message.If
// ---------------------------------------------------------------------------

type MessageRole = AnyUIMessage["role"];

export interface MessageIfProps {
  children: ReactNode;
  /** Show children only if message.role matches */
  role?: MessageRole | MessageRole[];
  /** Show children only if status matches */
  status?: string | string[];
  /** Show children only when this is the last message */
  isLast?: boolean;
}

export function MessageIf({ children, role, status, isLast }: MessageIfProps) {
  const ctx = useMessageContext();

  if (role !== undefined) {
    const roles = Array.isArray(role) ? role : [role];
    if (!roles.includes(ctx.message.role)) return null;
  }

  if (status !== undefined) {
    const statuses = Array.isArray(status) ? status : [status];
    if (!statuses.includes(ctx.status)) return null;
  }

  if (isLast !== undefined && ctx.isLast !== isLast) return null;

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Message.Parts
// ---------------------------------------------------------------------------

/** Component map for rendering different part types */
export interface PartComponentMap {
  Text?: ComponentType<{ part: AnyUIMessagePart; index: number }>;
  Reasoning?: ComponentType<{ part: AnyUIMessagePart; index: number }>;
  ToolCall?: ComponentType<{
    part: DynamicToolUIPart | ToolUIPart<UITools>;
    index: number;
  }>;
  Source?: ComponentType<{ part: AnyUIMessagePart; index: number }>;
  Data?: ComponentType<{ part: AnyUIMessagePart; index: number }>;
  File?: ComponentType<{ part: AnyUIMessagePart; index: number }>;
  /** Fallback for unknown part types */
  Fallback?: ComponentType<{ part: AnyUIMessagePart; index: number }>;
  /** Component for rendering a group of parts */
  Group?: ComponentType<{ group: PartGroup; index: number }>;
}

export interface MessagePartsProps {
  /** Component map for rendering parts */
  components: PartComponentMap;
  /** Optional grouping rules (uses GroupingEngine) */
  groupRules?: GroupRule[];
}

export function MessageParts({ components, groupRules }: MessagePartsProps) {
  const { message } = useMessageContext();
  const registry = useAgentUI((s) => s.registry);

  const groups = useMemo(
    () => (groupRules ? groupParts(message.parts, groupRules) : null),
    [message.parts, groupRules],
  );

  // Grouped rendering
  if (groups && components.Group) {
    const GroupComponent = components.Group;
    return (
      <>
        {groups.map((group, i) => {
          if (group.key === "__ungrouped__") {
            // Render ungrouped parts individually
            return group.parts.map((part, j) => (
              <PartRenderer
                key={partKey(part.type, group.startIndex + j)}
                part={part}
                index={group.startIndex + j}
                components={components}
                registry={registry}
              />
            ));
          }
          return (
            <GroupComponent
              key={`group-${group.key}-${group.startIndex}`}
              group={group}
              index={i}
            />
          );
        })}
      </>
    );
  }

  // Flat rendering (no grouping)
  return (
    <>
      {message.parts.map((part, index) => (
        <PartRenderer
          key={partKey(part.type, index)}
          part={part}
          index={index}
          components={components}
          registry={registry}
        />
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Compute a stable key for a part (parts lack unique IDs) */
function partKey(type: string, position: number): string {
  return `part-${type}-${position}`;
}

// ---------------------------------------------------------------------------
// Internal Part Renderer
// ---------------------------------------------------------------------------

interface PartRendererProps {
  part: AnyUIMessagePart;
  index: number;
  components: PartComponentMap;
  registry: import("@agent-ui-sdk/core").UIRegistry;
}

function PartRenderer({ part, index, components, registry }: PartRendererProps) {
  // Tool parts: use AI SDK type guard (matches both static and dynamic)
  if (isToolUIPart(part)) {
    const toolName = getToolName(part);
    const registered = registry.getToolUI(toolName);
    if (registered?.render) {
      const RegisteredComponent = registered.render as ComponentType<{
        part: typeof part;
        index: number;
      }>;
      return <RegisteredComponent part={part} index={index} />;
    }
    if (components.ToolCall) {
      return <components.ToolCall part={part} index={index} />;
    }
  }

  // Data parts: use AI SDK type guard
  if (isDataUIPart(part)) {
    const name = getDataPartName(part);
    const registered = registry.getDataUI(name);
    if (registered?.render) {
      const RegisteredComponent = registered.render as ComponentType<{
        part: AnyUIMessagePart;
        index: number;
      }>;
      return <RegisteredComponent part={part} index={index} />;
    }
    if (components.Data) {
      return <components.Data part={part} index={index} />;
    }
  }

  // Standard parts by type discriminant
  switch (part.type) {
    case "text":
      return components.Text ? <components.Text part={part} index={index} /> : null;
    case "reasoning":
      return components.Reasoning ? <components.Reasoning part={part} index={index} /> : null;
    case "source-url":
    case "source-document":
      return components.Source ? <components.Source part={part} index={index} /> : null;
    case "file":
      return components.File ? <components.File part={part} index={index} /> : null;
    case "step-start":
      return null; // Step boundaries are typically not rendered
    default:
      return components.Fallback ? <components.Fallback part={part} index={index} /> : null;
  }
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Message = {
  Root: MessageRoot,
  If: MessageIf,
  Parts: MessageParts,
};
