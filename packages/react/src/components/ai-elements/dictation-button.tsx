"use client";

import type { DictationAdapter } from "@agent-ui-sdk/core";
import { CheckIcon, MicIcon, SquareIcon, XIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "src/components/ui/button";
import { Spinner } from "src/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "src/components/ui/tooltip";
import { useDictation } from "src/hooks/use-dictation";
import { cn } from "src/lib/utils";

export type DictationButtonProps = ComponentProps<typeof Button> & {
  adapter: DictationAdapter | undefined;
  onResult?: (transcript: string) => void;
  tooltip?: string;
};

const WAVEFORM_DELAYS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6];

function WaveformAnimation() {
  return (
    <div className="flex items-center justify-center gap-0.5">
      {WAVEFORM_DELAYS.map((delay) => (
        <div
          className="w-1 rounded-full bg-red-400"
          key={delay}
          style={{
            animation: `dictation-wave 1.2s ease-in-out ${delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes dictation-wave {
          0%, 100% { height: 8px; }
          50% { height: 20px; }
        }
      `}</style>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function DictationButton({
  adapter,
  onResult,
  tooltip,
  className,
  size = "icon-sm",
  variant = "ghost",
  ...props
}: DictationButtonProps) {
  const { status, start, stop, cancel } = useDictation({ adapter, onResult });

  const isListening = status === "listening";
  const isProcessing = status === "processing";
  const showConfirmation = isListening && adapter?.requireConfirmation;

  // Duration tracking for confirmation mode
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isListening && adapter?.requireConfirmation) {
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isListening, adapter?.requireConfirmation]);

  const handleClick = useCallback(() => {
    if (isListening) {
      if (adapter?.requireConfirmation) {
        // In confirmation mode, clicking the main button does nothing
        // User must use confirm/cancel buttons
        return;
      }
      stop();
    } else {
      start();
    }
  }, [isListening, adapter?.requireConfirmation, stop, start]);

  const handleConfirm = useCallback(() => {
    stop();
  }, [stop]);

  const handleCancel = useCallback(() => {
    cancel();
  }, [cancel]);

  const content = (
    <div className="relative inline-flex items-center justify-center">
      {/* Confirmation panel — positioned above the button */}
      {showConfirmation && (
        <div className="absolute bottom-full z-50 mb-2 flex flex-col items-center gap-2 rounded-xl border bg-popover p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="size-2 animate-pulse rounded-full bg-red-500" />
            <span className="font-mono text-sm text-foreground">{formatDuration(duration)}</span>
          </div>
          <WaveformAnimation />
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCancel}
              size="icon-xs"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
            >
              <XIcon className="size-4" />
            </Button>
            <Button
              onClick={handleConfirm}
              size="icon-xs"
              variant="ghost"
              className="text-muted-foreground hover:text-primary"
            >
              <CheckIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Pulse animation rings */}
      {isListening &&
        [0, 1, 2].map((i) => (
          <div
            className="absolute inset-0 animate-ping rounded-full border-2 border-red-400/30"
            key={i}
            style={{ animationDelay: `${i * 0.3}s`, animationDuration: "2s" }}
          />
        ))}

      {/* Main button */}
      <Button
        className={cn(
          "relative z-10 rounded-full transition-all duration-300",
          isListening && "bg-destructive text-white hover:bg-destructive/80",
          className,
        )}
        disabled={!adapter || isProcessing}
        onClick={handleClick}
        size={size}
        variant={isListening ? "destructive" : variant}
        {...props}
      >
        {isProcessing && <Spinner />}
        {!isProcessing && isListening && <SquareIcon className="size-4" />}
        {!(isProcessing || isListening) && <MicIcon className="size-4" />}
      </Button>
    </div>
  );

  if (tooltip && !isListening && !isProcessing) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
