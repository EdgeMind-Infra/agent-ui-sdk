/**
 * AgentUI Zustand Store — centralized state for the chat UI.
 *
 * Holds messages, streaming status, runtime actions, and references
 * to core instances (MessageRepository, UIRegistry).
 */

import { createStore } from "zustand/vanilla";
import {
  type AnyUIMessage,
  type ChatStatus,
  createUIRegistry,
  MessageRepository,
  type UIRegistry,
} from "../index";

/** Re-export ChatStatus from AI SDK for convenience */
export type { ChatStatus } from "../index";

/** Runtime action callbacks — provided by the adapter (e.g., AI SDK adapter) */
export interface RuntimeActions {
  /** Send a new message */
  onNew?: (message: { content: string; attachments?: unknown[] }) => void;
  /** Edit and resend from a specific message */
  onEdit?: (messageId: string, content: string) => void;
  /** Regenerate the last response */
  onRegenerate?: () => void;
  /** Cancel the current generation */
  onCancel?: () => void;
  /** Provide feedback on a message */
  onFeedback?: (messageId: string, type: "positive" | "negative") => void;
  /** Respond to a tool approval request */
  onToolApprovalResponse?: (options: { id: string; approved: boolean; reason?: string }) => void;
}

export interface AgentUIState {
  /** Current linear message thread (follows active branches) */
  messages: AnyUIMessage[];
  /** Chat status */
  chatStatus: ChatStatus;
  /** Whether the AI is currently generating */
  isRunning: boolean;
  /** Whether history is being loaded from the adapter */
  isLoading: boolean;
  /** Currently active thread ID (managed by useThreadList) */
  currentThreadId: string | undefined;
  /** Error if chatStatus is "error" */
  error: unknown | null;
  /** Message repository (branch-aware tree) */
  repository: MessageRepository;
  /** UI registry for custom tool/data renderers */
  registry: UIRegistry;
  /** Runtime action callbacks */
  actions: RuntimeActions;
}

export interface AgentUIActions {
  /** Set the message list directly */
  setMessages: (messages: AnyUIMessage[]) => void;
  /** Sync messages into the repository and refresh the linear view */
  syncMessages: (messages: AnyUIMessage[], parentMap?: Map<string, string | null>) => void;
  /** Update chat status */
  setChatStatus: (status: ChatStatus) => void;
  /** Set error */
  setError: (error: unknown | null) => void;
  /** Update runtime actions */
  setActions: (actions: RuntimeActions) => void;
  /** Set the history loading state */
  setIsLoading: (loading: boolean) => void;
  /** Set the currently active thread ID */
  setCurrentThreadId: (id: string | undefined) => void;
  /** Refresh messages from repository (after branch switch) */
  refreshMessages: () => void;
}

export type AgentUIStore = AgentUIState & AgentUIActions;

export interface CreateAgentUIStoreOptions {
  registry?: UIRegistry;
  repository?: MessageRepository;
  initialMessages?: AnyUIMessage[];
  actions?: RuntimeActions;
}

export function createAgentUIStore(options: CreateAgentUIStoreOptions = {}) {
  const repository = options.repository ?? new MessageRepository();
  const registry = options.registry ?? createUIRegistry();

  return createStore<AgentUIStore>((set, get) => ({
    // State
    messages: options.initialMessages ?? [],
    chatStatus: "ready",
    isRunning: false,
    isLoading: false,
    currentThreadId: undefined,
    error: null,
    repository,
    registry,
    actions: options.actions ?? {},

    // Actions
    setMessages: (messages) => set({ messages }),

    syncMessages: (messages, parentMap) => {
      for (const msg of messages) {
        const parentId = parentMap?.get(msg.id) ?? null;
        repository.addOrUpdateMessage(msg, parentId);
      }
      set({ messages: repository.getMessages() });
    },

    setChatStatus: (chatStatus) =>
      set({
        chatStatus,
        isRunning: chatStatus === "submitted" || chatStatus === "streaming",
      }),

    setError: (error) => set({ error }),

    setActions: (actions) => set({ actions }),

    setIsLoading: (isLoading) => set({ isLoading }),

    setCurrentThreadId: (currentThreadId) => set({ currentThreadId }),

    refreshMessages: () => {
      set({ messages: get().repository.getMessages() });
    },
  }));
}

export type AgentUIStoreApi = ReturnType<typeof createAgentUIStore>;
