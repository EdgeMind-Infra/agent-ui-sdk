/**
 * Reasoning Primitive (React Native) — Displays AI thinking/reasoning content.
 *
 * - Reasoning.Root: Context Provider + auto-collapse behavior
 * - Reasoning.Trigger: "Thinking..." or "Thought for N seconds"
 * - Reasoning.Content: Collapsible reasoning text
 *
 * Auto behaviors (same as Web):
 * - Auto-open when streaming starts
 * - Auto-close 1s after streaming ends (once only)
 * - Duration tracking
 */

import type { ReasoningUIPart } from "@agent-ui-sdk/core";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Pressable, type StyleProp, Text, View, type ViewStyle } from "react-native";

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

  useEffect(() => {
    if (isStreaming && !isOpen && !isExplicitlyClosed.current) {
      hasEverStreamed.current = true;
      setIsOpen(true);
    }
  }, [isStreaming, isOpen]);

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

export interface ReasoningRootProps {
  children: ReactNode;
  part: ReasoningUIPart;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disableAutoCollapse?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ReasoningRoot({
  children,
  part,
  open: controlledOpen,
  onOpenChange,
  disableAutoCollapse = false,
  style,
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
      <View style={style} testID="aui-reasoning-root">
        {children}
      </View>
    </ReasoningContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Reasoning.Trigger
// ---------------------------------------------------------------------------

export interface ReasoningTriggerProps {
  streamingLabel?: ReactNode;
  doneLabel?: (seconds: number) => ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ReasoningTrigger({ streamingLabel, doneLabel, style }: ReasoningTriggerProps) {
  const { isOpen, setIsOpen, isStreaming, duration } = useReasoningContext();
  const toggle = useCallback(() => setIsOpen(!isOpen), [isOpen, setIsOpen]);

  const label = isStreaming
    ? (streamingLabel ?? "Thinking...")
    : duration !== null
      ? (doneLabel?.(duration) ?? `Thought for ${duration}s`)
      : "Thinking";

  return (
    <Pressable
      onPress={toggle}
      style={style}
      testID="aui-reasoning-trigger"
      accessibilityRole="button"
      accessibilityLabel={typeof label === "string" ? label : "Toggle reasoning"}
    >
      {typeof label === "string" ? <Text>{label}</Text> : label}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Reasoning.Content
// ---------------------------------------------------------------------------

export interface ReasoningContentProps {
  children?: ReactNode;
  renderContent?: (text: string) => ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ReasoningContent({ children, renderContent, style }: ReasoningContentProps) {
  const { part, isOpen } = useReasoningContext();
  if (!isOpen) return null;

  return (
    <View style={style} testID="aui-reasoning-content">
      {children ?? (renderContent ? renderContent(part.text) : <Text selectable>{part.text}</Text>)}
    </View>
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
