// =============================================================================
// Dictation Adapter — speech-to-text abstraction
// =============================================================================

export type Unsubscribe = () => void;

// -----------------------------------------------------------------------------
// DictationAdapter interface
// -----------------------------------------------------------------------------

export namespace DictationAdapter {
  export type Status =
    | { type: "starting" | "running" }
    | { type: "ended"; reason: "stopped" | "cancelled" | "error" };

  export type Result = {
    transcript: string;
    isFinal?: boolean;
  };

  export type Session = {
    status: Status;
    stop: () => Promise<void>;
    cancel: () => void;
    onSpeech: (callback: (result: Result) => void) => Unsubscribe;
  };
}

export type DictationAdapter = {
  listen: () => DictationAdapter.Session;
  requireConfirmation?: boolean;
};

// =============================================================================
// Web Speech Dictation Adapter
// =============================================================================

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionResultItem;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const getSpeechRecognitionAPI = (): SpeechRecognitionConstructor | undefined => {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
};

export type WebSpeechDictationAdapterOptions = {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
};

export class WebSpeechDictationAdapter implements DictationAdapter {
  private _language: string;
  private _continuous: boolean;
  private _interimResults: boolean;

  constructor(options: WebSpeechDictationAdapterOptions = {}) {
    const defaultLanguage =
      typeof navigator !== "undefined" && navigator.language ? navigator.language : "en-US";
    this._language = options.language ?? defaultLanguage;
    this._continuous = options.continuous ?? true;
    this._interimResults = options.interimResults ?? true;
  }

  static isSupported(): boolean {
    return getSpeechRecognitionAPI() !== undefined;
  }

  listen(): DictationAdapter.Session {
    const API = getSpeechRecognitionAPI();
    if (!API) {
      throw new Error(
        "SpeechRecognition is not supported in this browser. Try using Chrome, Edge, or Safari.",
      );
    }

    const recognition = new API();
    recognition.lang = this._language;
    recognition.continuous = this._continuous;
    recognition.interimResults = this._interimResults;

    const speechCallbacks = new Set<(result: DictationAdapter.Result) => void>();

    const session: DictationAdapter.Session = {
      status: { type: "starting" },

      stop: async () => {
        recognition.stop();
        return new Promise<void>((resolve) => {
          const checkEnded = () => {
            if (session.status.type === "ended") {
              resolve();
            } else {
              setTimeout(checkEnded, 50);
            }
          };
          checkEnded();
        });
      },

      cancel: () => {
        recognition.abort();
      },

      onSpeech: (callback): Unsubscribe => {
        speechCallbacks.add(callback);
        return () => {
          speechCallbacks.delete(callback);
        };
      },
    };

    recognition.addEventListener("start", () => {
      session.status = { type: "running" };
    });

    recognition.addEventListener("result", (event) => {
      const e = event as unknown as SpeechRecognitionEvent;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (!result) continue;
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          for (const cb of speechCallbacks) cb({ transcript, isFinal: true });
        } else {
          for (const cb of speechCallbacks) cb({ transcript, isFinal: false });
        }
      }
    });

    recognition.addEventListener("end", () => {
      if (session.status.type !== "ended") {
        session.status = { type: "ended", reason: "stopped" };
      }
    });

    recognition.addEventListener("error", (event) => {
      const e = event as unknown as SpeechRecognitionErrorEvent;
      if (e.error === "aborted") {
        session.status = { type: "ended", reason: "cancelled" };
      } else {
        session.status = { type: "ended", reason: "error" };
      }
    });

    try {
      recognition.start();
    } catch {
      session.status = { type: "ended", reason: "error" };
    }

    return session;
  }
}

// =============================================================================
// MediaRecorder Dictation Adapter
// =============================================================================

export type MediaRecorderDictationAdapterOptions = {
  transcribe: (audioBlob: Blob) => Promise<string>;
  requireConfirmation?: boolean;
};

export class MediaRecorderDictationAdapter implements DictationAdapter {
  private _transcribe: (audioBlob: Blob) => Promise<string>;
  readonly requireConfirmation: boolean;

  constructor(options: MediaRecorderDictationAdapterOptions) {
    this._transcribe = options.transcribe;
    this.requireConfirmation = options.requireConfirmation ?? false;
  }

  static isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return "MediaRecorder" in window && "mediaDevices" in navigator;
  }

  listen(): DictationAdapter.Session {
    const speechCallbacks = new Set<(result: DictationAdapter.Result) => void>();
    const chunks: Blob[] = [];
    let mediaRecorder: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    let discarded = false;

    const session: DictationAdapter.Session = {
      status: { type: "starting" },

      stop: async () => {
        if (mediaRecorder?.state === "recording") {
          mediaRecorder.stop();
        }
        // Wait for the processing to complete
        return new Promise<void>((resolve) => {
          const checkEnded = () => {
            if (session.status.type === "ended") {
              resolve();
            } else {
              setTimeout(checkEnded, 50);
            }
          };
          checkEnded();
        });
      },

      cancel: () => {
        discarded = true;
        if (mediaRecorder?.state === "recording") {
          mediaRecorder.stop();
        }
        if (stream) {
          for (const track of stream.getTracks()) track.stop();
          stream = null;
        }
        session.status = { type: "ended", reason: "cancelled" };
      },

      onSpeech: (callback): Unsubscribe => {
        speechCallbacks.add(callback);
        return () => {
          speechCallbacks.delete(callback);
        };
      },
    };

    // Start recording asynchronously
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((mediaStream) => {
        if (discarded) {
          for (const track of mediaStream.getTracks()) track.stop();
          return;
        }

        stream = mediaStream;
        mediaRecorder = new MediaRecorder(mediaStream);

        mediaRecorder.addEventListener("dataavailable", (e: BlobEvent) => {
          if (e.data.size > 0) chunks.push(e.data);
        });

        mediaRecorder.addEventListener("stop", async () => {
          if (stream) {
            for (const track of stream.getTracks()) track.stop();
            stream = null;
          }

          if (discarded) {
            session.status = { type: "ended", reason: "cancelled" };
            return;
          }

          const audioBlob = new Blob(chunks, { type: "audio/webm" });
          if (audioBlob.size === 0) {
            session.status = { type: "ended", reason: "stopped" };
            return;
          }

          try {
            const transcript = await this._transcribe(audioBlob);
            if (transcript) {
              for (const cb of speechCallbacks) cb({ transcript, isFinal: true });
            }
            session.status = { type: "ended", reason: "stopped" };
          } catch {
            session.status = { type: "ended", reason: "error" };
          }
        });

        mediaRecorder.start();
        session.status = { type: "running" };
      })
      .catch(() => {
        session.status = { type: "ended", reason: "error" };
      });

    return session;
  }
}

// =============================================================================
// Fallback Adapter Factory
// =============================================================================

export type FallbackDictationAdapterOptions = {
  transcribe?: (audioBlob: Blob) => Promise<string>;
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  requireConfirmation?: boolean;
};

export function createFallbackDictationAdapter(
  options: FallbackDictationAdapterOptions = {},
): DictationAdapter | undefined {
  if (WebSpeechDictationAdapter.isSupported()) {
    return new WebSpeechDictationAdapter({
      language: options.language,
      continuous: options.continuous,
      interimResults: options.interimResults,
    });
  }

  if (options.transcribe && MediaRecorderDictationAdapter.isSupported()) {
    return new MediaRecorderDictationAdapter({
      transcribe: options.transcribe,
      requireConfirmation: options.requireConfirmation,
    });
  }

  return undefined;
}
