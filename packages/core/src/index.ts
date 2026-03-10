// @agent-ui-sdk/core
// Platform-agnostic core — message repository, adapters, types
//
// This package contains NO platform-specific code (no React, no DOM, no RN).
// React/RN bindings live in their respective packages.

export type {
  DictationAdapter,
  FallbackDictationAdapterOptions,
  MediaRecorderDictationAdapterOptions,
  Unsubscribe,
  WebSpeechDictationAdapterOptions,
} from "./adapters/dictation";
export {
  createFallbackDictationAdapter,
  MediaRecorderDictationAdapter,
  WebSpeechDictationAdapter,
} from "./adapters/dictation";
export { InMemoryHistoryAdapter } from "./adapters/in-memory-history-adapter";
export { InMemoryThreadListAdapter } from "./adapters/in-memory-thread-list-adapter";
export { MessageRepository } from "./message-repository";
export { ToolUIRegistry } from "./tool-ui-registry";
export type {
  ExportedMessage,
  MessageNode,
  ThreadHistoryAdapter,
  ThreadListAdapter,
  ThreadMetadata,
} from "./types";
