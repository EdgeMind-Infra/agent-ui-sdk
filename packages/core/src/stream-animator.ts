/**
 * StreamAnimator — Platform-agnostic adaptive-speed text animation.
 *
 * Animates text display character-by-character with adaptive speed:
 * - When close to target (small buffer): slow, smooth display (~5ms/char)
 * - When far behind (large buffer): fast catch-up to consume within ~250ms
 * - When stream ends: display all remaining text immediately
 *
 * Platform injection:
 * - Web: `scheduleFrame = requestAnimationFrame`
 * - RN: `scheduleFrame = (cb) => setTimeout(cb, 16)` or Reanimated worklet
 */

export interface StreamAnimatorOptions {
  /** Callback to set the displayed text */
  setText: (text: string) => void;
  /** Platform-specific frame scheduler (rAF on Web, setInterval on RN) */
  scheduleFrame: (callback: () => void) => number | ReturnType<typeof setTimeout>;
  /** Optional cancel function for the frame scheduler */
  cancelFrame?: (id: number | ReturnType<typeof setTimeout>) => void;
}

export class StreamAnimator {
  private targetText = "";
  private displayedText = "";
  private displayIndex = 0;
  private _isAnimating = false;
  private streamEnded = false;
  private frameId: number | ReturnType<typeof setTimeout> | null = null;
  private lastFrameTime = 0;

  private readonly setText: (text: string) => void;
  private readonly scheduleFrame: (callback: () => void) => number | ReturnType<typeof setTimeout>;
  private readonly cancelFrame: (id: number | ReturnType<typeof setTimeout>) => void;

  constructor(options: StreamAnimatorOptions) {
    this.setText = options.setText;
    this.scheduleFrame = options.scheduleFrame;
    this.cancelFrame =
      options.cancelFrame ??
      ((id) => {
        clearTimeout(id as ReturnType<typeof setTimeout>);
      });
  }

  /** Whether animation is currently playing (distinct from stream active) */
  get isAnimating(): boolean {
    return this._isAnimating;
  }

  /**
   * Push new target text from the stream.
   * Call this whenever new content arrives.
   */
  push(text: string): void {
    this.targetText = text;
    this.streamEnded = false;

    if (!this._isAnimating) {
      this._isAnimating = true;
      this.lastFrameTime = performance.now();
      this.tick();
    }
  }

  /**
   * Signal that the stream has ended.
   * All remaining buffered text will be displayed immediately.
   */
  finish(): void {
    this.streamEnded = true;

    // Display all remaining text immediately
    if (this.displayIndex < this.targetText.length) {
      this.displayIndex = this.targetText.length;
      this.displayedText = this.targetText;
      this.setText(this.displayedText);
    }

    this.stop();
  }

  /** Stop the animation and clean up */
  stop(): void {
    if (this.frameId !== null) {
      this.cancelFrame(this.frameId);
      this.frameId = null;
    }
    this._isAnimating = false;
  }

  /** Reset the animator to initial state */
  reset(): void {
    this.stop();
    this.targetText = "";
    this.displayedText = "";
    this.displayIndex = 0;
    this.streamEnded = false;
  }

  private tick = (): void => {
    const now = performance.now();
    const elapsed = now - this.lastFrameTime;
    this.lastFrameTime = now;

    const remaining = this.targetText.length - this.displayIndex;

    if (remaining <= 0) {
      // Caught up with target, wait for more or stop
      if (this.streamEnded) {
        this.stop();
        return;
      }
      // Keep animating — more text may arrive
      this.frameId = this.scheduleFrame(this.tick);
      return;
    }

    // Adaptive speed: consume buffer within ~250ms
    // When buffer is small: slow (up to 5ms/char) for smooth display
    // When buffer is large: fast catch-up
    const baseTimePerChar = Math.min(5, 250 / remaining);
    const charsToAdvance = Math.max(1, Math.floor(elapsed / baseTimePerChar));
    const actualAdvance = Math.min(charsToAdvance, remaining);

    this.displayIndex += actualAdvance;
    this.displayedText = this.targetText.slice(0, this.displayIndex);
    this.setText(this.displayedText);

    // Check if we've caught up
    if (this.displayIndex >= this.targetText.length && this.streamEnded) {
      this.stop();
      return;
    }

    this.frameId = this.scheduleFrame(this.tick);
  };
}
