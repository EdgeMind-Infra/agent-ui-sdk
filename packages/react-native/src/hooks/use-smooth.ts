/**
 * useSmooth — Smooth text animation hook for React Native.
 *
 * Uses core StreamAnimator with setInterval-based scheduling
 * (requestAnimationFrame is not available in all RN environments).
 */

import { StreamAnimator, type StreamAnimatorOptions } from "@agent-ui-sdk/core";
import { useEffect, useRef, useState } from "react";

const FRAME_INTERVAL = 16; // ~60fps

export interface UseSmoothOptions {
  /** The streaming text to animate */
  text: string;
  /** Whether the stream is complete */
  isComplete?: boolean;
  /** StreamAnimator options (speed, min chars per frame, etc.) */
  animatorOptions?: Partial<StreamAnimatorOptions>;
}

export interface UseSmoothReturn {
  /** The current displayed text (animated) */
  displayedText: string;
  /** Whether animation is currently running */
  isAnimating: boolean;
}

/**
 * Hook that smoothly animates streaming text arrival.
 *
 * @example
 * ```tsx
 * const { displayedText, isAnimating } = useSmooth({
 *   text: streamingContent,
 *   isComplete: !isStreaming,
 * });
 * ```
 */
export function useSmooth({
  text,
  isComplete = false,
  animatorOptions,
}: UseSmoothOptions): UseSmoothReturn {
  const [displayedText, setDisplayedText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);
  const animatorRef = useRef<StreamAnimator | null>(null);
  const optionsRef = useRef(animatorOptions);
  optionsRef.current = animatorOptions;

  // Initialize animator once
  useEffect(() => {
    const animator = new StreamAnimator({
      ...optionsRef.current,
      setText: (t) => setDisplayedText(t),
      // Use setInterval-based scheduling for RN compatibility
      scheduleFrame: (callback) => {
        const id = setInterval(callback, FRAME_INTERVAL);
        return id as unknown as number;
      },
      cancelFrame: (id) => {
        clearInterval(id as unknown as ReturnType<typeof setInterval>);
      },
    });
    animatorRef.current = animator;

    return () => {
      animator.stop();
    };
  }, []);

  // Push text updates to animator
  useEffect(() => {
    const animator = animatorRef.current;
    if (!animator) return;

    animator.push(text);
    setIsAnimating(animator.isAnimating);
  }, [text]);

  // Handle stream completion
  useEffect(() => {
    const animator = animatorRef.current;
    if (!animator) return;

    if (isComplete) {
      animator.finish();
      setIsAnimating(false);
    }
  }, [isComplete]);

  // Sync isAnimating state when text or completion changes
  useEffect(() => {
    const animator = animatorRef.current;
    if (!animator) return;

    const checkInterval = setInterval(() => {
      const animating = animator.isAnimating;
      setIsAnimating((prev) => (prev !== animating ? animating : prev));
      if (!animating) clearInterval(checkInterval);
    }, FRAME_INTERVAL * 2);

    return () => clearInterval(checkInterval);
  });

  return { displayedText, isAnimating };
}
