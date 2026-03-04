/**
 * Reasoning Primitive — Displays AI thinking/reasoning content.
 *
 * Provides:
 * - Reasoning.Root: Context Provider + Collapsible (controlled/uncontrolled)
 * - ReasoningTrigger: "Thinking..." shimmer or "Thought for N seconds"
 * - ReasoningContent: Renders reasoning text
 *
 * Auto behaviors:
 * - Auto-open when streaming starts
 * - Auto-close 1s after streaming ends (once only)
 * - Duration tracking from stream start to end
 */

import type { ReasoningUIPart } from "@agent-ui-sdk/core";
import {
  createContext,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Reasoning Context
// ---------------------------------------------------------------------------

interface ReasoningContextValue {
  part: ReasoningUIPart;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isStreaming: boolean;
  duration: number | null;
}

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

export function useReasoningContext(): ReasoningContextValue {
  const ctx = useContext(ReasoningContext);
  if (!ctx) throw new Error("useReasoningContext must be used within <Reasoning.Root>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Auto-collapse hook
// ---------------------------------------------------------------------------

const AUTO_CLOSE_DELAY = 1000;

function useReasoningAutoCollapse(isStreaming: boolean) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoClosed, setHasAutoClosed] = useState(false);
  const isExplicitlyClosed = useRef(false);
  const hasEverStreamed = useRef(false);

  // Auto-open on stream start
  useEffect(() => {
    if (isStreaming && !isOpen && !isExplicitlyClosed.current) {
      hasEverStreamed.current = true;
      setIsOpen(true);
    }
  }, [isStreaming, isOpen]);

  // Auto-close after stream ends (once only)
  useEffect(() => {
    if (hasEverStreamed.current && !isStreaming && isOpen && !hasAutoClosed) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        setHasAutoClosed(true);
      }, AUTO_CLOSE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [isStreaming, isOpen, hasAutoClosed]);

  const setIsOpenWrapped = useCallback((open: boolean) => {
    if (!open) isExplicitlyClosed.current = true;
    else isExplicitlyClosed.current = false;
    setIsOpen(open);
  }, []);

  return { isOpen, setIsOpen: setIsOpenWrapped };
}

// ---------------------------------------------------------------------------
// Duration tracking hook
// ---------------------------------------------------------------------------

function useReasoningDuration(isStreaming: boolean) {
  const [duration, setDuration] = useState<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isStreaming) {
      if (startTimeRef.current === null) {
        startTimeRef.current = Date.now();
      }
      setDuration(null);
    } else if (startTimeRef.current !== null) {
      setDuration(Math.ceil((Date.now() - startTimeRef.current) / 1000));
    }
  }, [isStreaming]);

  return duration;
}

// ---------------------------------------------------------------------------
// Reasoning.Root
// ---------------------------------------------------------------------------

export interface ReasoningRootProps extends Omit<HTMLAttributes<HTMLDivElement>, "part"> {
  children: ReactNode;
  part: ReasoningUIPart;
  /** Controlled open state */
  open?: boolean;
  /** Controlled open change handler */
  onOpenChange?: (open: boolean) => void;
  /** Disable auto-open/close behavior */
  disableAutoCollapse?: boolean;
}

export function ReasoningRoot({
  children,
  part,
  open: controlledOpen,
  onOpenChange,
  disableAutoCollapse = false,
  ...props
}: ReasoningRootProps) {
  const isStreaming = part.state === "streaming";
  const auto = useReasoningAutoCollapse(isStreaming);
  const duration = useReasoningDuration(isStreaming);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : disableAutoCollapse ? false : auto.isOpen;
  const setIsOpen = isControlled
    ? (v: boolean) => onOpenChange?.(v)
    : disableAutoCollapse
      ? () => {}
      : auto.setIsOpen;

  const ctx: ReasoningContextValue = {
    part,
    isOpen,
    setIsOpen,
    isStreaming,
    duration,
  };

  return (
    <ReasoningContext.Provider value={ctx}>
      <div
        data-aui="reasoning-root"
        data-streaming={isStreaming}
        data-open={isOpen}
        className="aui-reasoning-root"
        {...props}
      >
        {children}
      </div>
    </ReasoningContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Reasoning.Trigger
// ---------------------------------------------------------------------------

export interface ReasoningTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  /** Custom label when streaming */
  streamingLabel?: ReactNode;
  /** Custom label when done (receives duration in seconds) */
  doneLabel?: (seconds: number) => ReactNode;
}

export function ReasoningTrigger({ streamingLabel, doneLabel, ...props }: ReasoningTriggerProps) {
  const { isOpen, setIsOpen, isStreaming, duration } = useReasoningContext();

  const toggle = useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen]);

  const label = isStreaming
    ? (streamingLabel ?? "Thinking...")
    : duration !== null
      ? (doneLabel?.(duration) ?? `Thought for ${duration}s`)
      : "Thinking";

  return (
    <button
      type="button"
      data-aui="reasoning-trigger"
      data-streaming={isStreaming}
      className={`aui-reasoning-trigger${isStreaming ? " aui-reasoning-shimmer" : ""}`}
      onClick={toggle}
      {...props}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Reasoning.Content
// ---------------------------------------------------------------------------

export interface ReasoningContentProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Custom renderer for the reasoning text */
  renderContent?: (text: string) => ReactNode;
}

export function ReasoningContent({ children, renderContent, ...props }: ReasoningContentProps) {
  const { part, isOpen } = useReasoningContext();
  if (!isOpen) return null;

  return (
    <div data-aui="reasoning-content" className="aui-reasoning-content" {...props}>
      {children ?? (renderContent ? renderContent(part.text) : part.text)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Reasoning = {
  Root: ReasoningRoot,
  Trigger: ReasoningTrigger,
  Content: ReasoningContent,
};
