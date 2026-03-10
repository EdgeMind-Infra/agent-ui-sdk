"use client";

import type { DictationAdapter } from "@agent-ui-sdk/core";
import { useCallback, useEffect, useRef, useState } from "react";

export type DictationStatus = "idle" | "listening" | "processing";

export type UseDictationOptions = {
  adapter: DictationAdapter | undefined;
  onResult?: (transcript: string) => void;
};

export type UseDictationReturn = {
  status: DictationStatus;
  transcript: string;
  start: () => void;
  stop: () => void;
  cancel: () => void;
};

export function useDictation({ adapter, onResult }: UseDictationOptions): UseDictationReturn {
  const [status, setStatus] = useState<DictationStatus>("idle");
  const [transcript, setTranscript] = useState("");

  const sessionRef = useRef<DictationAdapter.Session | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const cleanup = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
    sessionRef.current = null;
    setTranscript("");
  }, []);

  const start = useCallback(() => {
    if (!adapter || sessionRef.current) return;

    const session = adapter.listen();
    sessionRef.current = session;
    setStatus("listening");
    setTranscript("");

    const unsub = session.onSpeech((result) => {
      if (result.isFinal) {
        setTranscript("");
        onResultRef.current?.(result.transcript);
      } else {
        setTranscript(result.transcript);
      }
    });
    unsubRef.current = unsub;

    // Poll for session end to update status
    const checkEnded = () => {
      if (session.status.type === "ended") {
        if (session.status.reason === "stopped") {
          setStatus("idle");
        } else {
          setStatus("idle");
        }
        cleanup();
      } else {
        setTimeout(checkEnded, 100);
      }
    };

    // Start polling after a tick to allow the session to initialize
    setTimeout(checkEnded, 200);
  }, [adapter, cleanup]);

  const stop = useCallback(async () => {
    const session = sessionRef.current;
    if (!session) return;
    setStatus("processing");
    await session.stop();
    // cleanup happens via the checkEnded polling
  }, []);

  const cancel = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.cancel();
    setStatus("idle");
    cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (sessionRef.current) {
        sessionRef.current.cancel();
        cleanup();
      }
    },
    [cleanup],
  );

  return { status, transcript, start, stop, cancel };
}
