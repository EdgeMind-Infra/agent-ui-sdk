import { describe, expect, it, vi } from "vitest";
import { StreamAnimator } from "../stream-animator";

function createTestAnimator() {
  const calls: string[] = [];
  let frameCallback: (() => void) | null = null;
  let frameId = 0;

  const animator = new StreamAnimator({
    setText: (text) => calls.push(text),
    scheduleFrame: (cb) => {
      frameCallback = cb;
      return ++frameId;
    },
    cancelFrame: () => {
      frameCallback = null;
    },
  });

  /** Advance one animation frame (simulates rAF firing) */
  const advanceFrame = () => {
    const cb = frameCallback;
    frameCallback = null;
    cb?.();
  };

  /** Advance multiple frames */
  const advanceFrames = (n: number) => {
    for (let i = 0; i < n; i++) advanceFrame();
  };

  return { animator, calls, advanceFrame, advanceFrames };
}

describe("StreamAnimator", () => {
  it("should start with isAnimating=false", () => {
    const { animator } = createTestAnimator();
    expect(animator.isAnimating).toBe(false);
  });

  it("should set isAnimating=true after push()", () => {
    const { animator } = createTestAnimator();
    animator.push("Hello");
    expect(animator.isAnimating).toBe(true);
  });

  it("should animate text character-by-character", () => {
    const { animator, calls, advanceFrame } = createTestAnimator();

    // Mock performance.now for deterministic timing
    let time = 0;
    vi.spyOn(performance, "now").mockImplementation(() => time);

    animator.push("Hi");

    // First tick: scheduled immediately
    // Advance time by a small amount (< 5ms) to get 1 char
    time += 3;
    advanceFrame();

    expect(calls.length).toBeGreaterThan(0);
    // The displayed text should be a prefix of "Hi"
    expect("Hi".startsWith(calls[calls.length - 1]!)).toBe(true);

    vi.restoreAllMocks();
  });

  it("should finish immediately and display all text when finish() called", () => {
    const { animator, calls } = createTestAnimator();

    vi.spyOn(performance, "now").mockImplementation(() => 0);
    animator.push("Hello World");
    animator.finish();

    expect(calls[calls.length - 1]).toBe("Hello World");
    expect(animator.isAnimating).toBe(false);

    vi.restoreAllMocks();
  });

  it("should stop animating after finish()", () => {
    const { animator } = createTestAnimator();

    vi.spyOn(performance, "now").mockImplementation(() => 0);
    animator.push("text");
    expect(animator.isAnimating).toBe(true);

    animator.finish();
    expect(animator.isAnimating).toBe(false);

    vi.restoreAllMocks();
  });

  it("should catch up faster when buffer is large", () => {
    const { animator, calls, advanceFrame } = createTestAnimator();

    let time = 0;
    vi.spyOn(performance, "now").mockImplementation(() => time);

    // Push a large amount of text
    const longText = "A".repeat(1000);
    animator.push(longText);

    // Advance 16ms (one frame at 60fps)
    time += 16;
    advanceFrame();

    // With 1000 chars buffered, baseTimePerChar = min(5, 250/1000) = 0.25ms
    // In 16ms, should advance 16/0.25 = 64 chars
    const lastText = calls[calls.length - 1]!;
    expect(lastText.length).toBeGreaterThan(10);

    vi.restoreAllMocks();
  });

  it("should reset to initial state", () => {
    const { animator } = createTestAnimator();

    vi.spyOn(performance, "now").mockImplementation(() => 0);
    animator.push("test");
    expect(animator.isAnimating).toBe(true);

    animator.reset();
    expect(animator.isAnimating).toBe(false);

    vi.restoreAllMocks();
  });

  it("should handle multiple push() calls (streaming updates)", () => {
    const { animator, calls, advanceFrame } = createTestAnimator();

    let time = 0;
    vi.spyOn(performance, "now").mockImplementation(() => time);

    animator.push("He");
    time += 50;
    advanceFrame();

    animator.push("Hello");
    time += 50;
    advanceFrame();

    animator.push("Hello World");
    time += 50;
    advanceFrame();

    // After enough time, should show some prefix of "Hello World"
    const lastText = calls[calls.length - 1]!;
    expect("Hello World".startsWith(lastText)).toBe(true);

    vi.restoreAllMocks();
  });

  it("stream ended but animation still catching up = isAnimating true", () => {
    const { animator, advanceFrame } = createTestAnimator();

    let time = 0;
    vi.spyOn(performance, "now").mockImplementation(() => time);

    // Push text but don't advance frames much
    const longText = "B".repeat(500);
    animator.push(longText);

    // Advance only one tiny frame
    time += 1;
    advanceFrame();

    // Animation should still be running
    expect(animator.isAnimating).toBe(true);

    // Now finish
    animator.finish();
    // After finish, all text displayed and animation stops
    expect(animator.isAnimating).toBe(false);

    vi.restoreAllMocks();
  });
});
