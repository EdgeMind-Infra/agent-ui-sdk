"use client";

import type { Editor } from "@tiptap/core";
import { Mention } from "@tiptap/extension-mention";
import Placeholder from "@tiptap/extension-placeholder";
import { PluginKey } from "@tiptap/pm/state";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import { CornerDownLeftIcon, SquareIcon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "src/lib/utils";
import { CommandTag } from "../../extensions/command-tag";
import { SlashCommand } from "../../extensions/slash-command";
import { SubmitOnEnter } from "../../extensions/submit-on-enter";
import type {
  ChatHelpers,
  CommandData,
  MentionData,
  RichPromptInputProps,
  RichPromptInputSubmitPayload,
  SuggestionRenderProps,
  TriggerConfig,
} from "../../types";

// ============================================================================
// Internal types
// ============================================================================

interface SuggestionPopupState {
  triggerIndex: number;
  items: unknown[];
  query: string;
  command: (item: unknown) => void;
  clientRect: (() => DOMRect | null) | null;
  selectedIndex: number;
}

// ============================================================================
// ChatContext (optional — only used if no chatHelpers prop)
// ============================================================================

interface ChatContextValue {
  chatHelpers: ChatHelpers;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function useChatHelpersFromContext(): ChatHelpers | null {
  const ctx = useContext(ChatContext);
  return ctx?.chatHelpers ?? null;
}

// ============================================================================
// Suggestion popup portal
// ============================================================================

function SuggestionPortal({
  state,
  triggers,
}: {
  state: SuggestionPopupState;
  triggers: TriggerConfig<any>[];
}) {
  const trigger = triggers[state.triggerIndex];
  if (!trigger) return null;

  const renderProps: SuggestionRenderProps = {
    items: state.items,
    query: state.query,
    command: state.command,
    clientRect: state.clientRect,
    selectedIndex: state.selectedIndex,
  };

  const content = trigger.render(renderProps);
  if (!content) return null;

  const rect = state.clientRect?.();

  return createPortal(
    <div
      data-slot="suggestion-popup"
      className="aui-suggestion-popup"
      style={
        rect
          ? {
              position: "fixed",
              left: `${rect.left}px`,
              top: `${rect.bottom + 4}px`,
              zIndex: 50,
            }
          : { display: "none" }
      }
    >
      {content}
    </div>,
    document.body,
  );
}

// ============================================================================
// Content serialization
// ============================================================================

function serializeEditorContent(editor: Editor): RichPromptInputSubmitPayload {
  const mentions: MentionData[] = [];
  const commands: CommandData[] = [];

  // Walk the document to collect mention and command tag nodes
  editor.state.doc.descendants((node) => {
    if (node.type.name === "mention") {
      mentions.push({
        id: node.attrs.id ?? "",
        label: node.attrs.label ?? "",
      });
    } else if (node.type.name === "commandTag") {
      commands.push({
        id: node.attrs.id ?? "",
        label: node.attrs.label ?? "",
      });
    }
  });

  const text = editor.getText();

  return { text: text.trim(), mentions, commands };
}

// ============================================================================
// Build TipTap extensions from trigger configs
// ============================================================================

function buildSuggestionRender(
  triggerIndex: number,
  setState: React.Dispatch<React.SetStateAction<SuggestionPopupState | null>>,
  suggestionOpenRef: React.RefObject<boolean>,
): () => ReturnType<NonNullable<SuggestionOptions["render"]>> {
  // Mutable refs to track current items/command/selectedIndex across callbacks
  let currentItems: unknown[] = [];
  let currentCommand: ((item: unknown) => void) | null = null;
  let currentSelectedIndex = 0;

  return () => {
    return {
      onStart: (props: SuggestionProps) => {
        suggestionOpenRef.current = true;
        currentItems = props.items;
        currentCommand = props.command;
        currentSelectedIndex = 0;
        setState({
          triggerIndex,
          items: props.items,
          query: props.query,
          command: props.command,
          clientRect: props.clientRect ?? null,
          selectedIndex: 0,
        });
      },
      onUpdate: (props: SuggestionProps) => {
        currentItems = props.items;
        currentCommand = props.command;
        currentSelectedIndex = 0;
        setState({
          triggerIndex,
          items: props.items,
          query: props.query,
          command: props.command,
          clientRect: props.clientRect ?? null,
          selectedIndex: 0,
        });
      },
      onExit: () => {
        suggestionOpenRef.current = false;
        currentItems = [];
        currentCommand = null;
        currentSelectedIndex = 0;
        setState(null);
      },
      onKeyDown: (props: { event: KeyboardEvent }) => {
        const { key } = props.event;

        if (key === "Escape") {
          suggestionOpenRef.current = false;
          setState(null);
          return true;
        }

        if (key === "ArrowDown") {
          currentSelectedIndex = (currentSelectedIndex + 1) % (currentItems.length || 1);
          setState((prev) => (prev ? { ...prev, selectedIndex: currentSelectedIndex } : prev));
          return true;
        }

        if (key === "ArrowUp") {
          currentSelectedIndex =
            (currentSelectedIndex - 1 + (currentItems.length || 1)) % (currentItems.length || 1);
          setState((prev) => (prev ? { ...prev, selectedIndex: currentSelectedIndex } : prev));
          return true;
        }

        if (key === "Enter") {
          const item = currentItems[currentSelectedIndex];
          if (item != null && currentCommand) {
            currentCommand(item);
            return true;
          }
        }

        return false;
      },
    };
  };
}

// ============================================================================
// Main component
// ============================================================================

export function RichPromptInput({
  triggers = [],
  placeholder = "",
  onSubmit,
  chatHelpers: chatHelpersProp,
  className,
  disabled = false,
  autoFocus = true,
}: RichPromptInputProps) {
  const chatHelpersFromCtx = useChatHelpersFromContext();
  const chatHelpers = chatHelpersProp ?? chatHelpersFromCtx;

  const [popupState, setPopupState] = useState<SuggestionPopupState | null>(null);
  const suggestionOpenRef = useRef(false);

  // Build extensions from triggers
  const commandTagTrigger = triggers.find((t) => t.type === "command" && t.insertAsTag);
  const hasCommandTag = !!commandTagTrigger;
  const commandRenderNode = commandTagTrigger?.renderNode;

  // biome-ignore lint/correctness/useExhaustiveDependencies: triggers is caller-controlled; we use length as a stable proxy to avoid rebuilding extensions on every render
  const extensions = useMemo(() => {
    const exts: any[] = [
      StarterKit.configure({
        // Disable heading, blockquote, etc. — this is a chat input, not a document editor
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Placeholder.configure({ placeholder }),
    ];

    // Register CommandTag node if any trigger uses insertAsTag
    if (hasCommandTag) {
      exts.push(
        CommandTag.configure({
          renderNode: commandRenderNode,
        }),
      );
    }

    // Process each trigger
    for (let i = 0; i < triggers.length; i++) {
      const trigger = triggers[i]!;
      const type = trigger.type ?? "mention";

      if (type === "mention") {
        // Use @tiptap/extension-mention for mention-type triggers
        exts.push(
          Mention.configure({
            HTMLAttributes: {
              class: "aui-mention-tag",
              "data-slot": "mention-tag",
            },
            renderText: ({ node }) => `@${node.attrs.label ?? node.attrs.id}`,
            suggestion: {
              char: trigger.char,
              pluginKey: new PluginKey(`mention-${trigger.char}`),
              items: ({ query }) => trigger.items(query),
              render: buildSuggestionRender(i, setPopupState, suggestionOpenRef),
              command: ({ editor, range, props: item }) => {
                const label = (item as any)?.label ?? (item as any)?.name ?? String(item);
                const id = (item as any)?.id ?? label;
                editor
                  .chain()
                  .focus()
                  .insertContentAt(range, [
                    { type: "mention", attrs: { id, label } },
                    { type: "text", text: " " },
                  ])
                  .run();
              },
            },
          }),
        );
      } else {
        // Use custom slash command extension for command-type triggers
        const insertAsTag = trigger.insertAsTag ?? false;

        exts.push(
          SlashCommand.configure({
            suggestion: {
              char: trigger.char,
              pluginKey: new PluginKey(`slash-${trigger.char}`),
              startOfLine: false,
              items: ({ query }) => trigger.items(query),
              render: buildSuggestionRender(i, setPopupState, suggestionOpenRef),
              command: ({ editor, range, props: item }) => {
                if (insertAsTag) {
                  // Insert as an inline command tag node
                  const label = (item as any)?.label ?? (item as any)?.name ?? String(item);
                  const id = (item as any)?.id ?? label;
                  editor
                    .chain()
                    .focus()
                    .insertContentAt(range, [
                      { type: "commandTag", attrs: { id, label } },
                      { type: "text", text: " " },
                    ])
                    .run();
                } else {
                  // Delete the trigger text and execute callback
                  editor.chain().focus().deleteRange(range).run();
                }
                trigger.onSelect?.(item);
              },
            },
          }),
        );
      }
    }

    return exts;
  }, [triggers.length, placeholder, hasCommandTag, commandRenderNode]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: editor is declared after this hook (circular dep with useEditor); accessed only at invocation time
  const handleSubmit = useCallback(() => {
    if (!editor || editor.isEmpty) return;

    const payload = serializeEditorContent(editor);
    if (!payload.text && payload.mentions.length === 0 && payload.commands.length === 0) return;

    if (onSubmit) {
      onSubmit(payload);
    } else if (chatHelpers) {
      chatHelpers.sendMessage({ text: payload.text });
    }

    editor.commands.clearContent(true);
  }, [onSubmit, chatHelpers]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...extensions,
      SubmitOnEnter.configure({
        onSubmit: () => handleSubmit(),
        isSuggestionOpen: () => suggestionOpenRef.current,
      }),
    ],
    editable: !disabled,
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: {
        class: "aui-rich-prompt-input-editor",
        "data-slot": "rich-prompt-input",
      },
    },
  });

  // Update editable state when disabled changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  const isStreaming = chatHelpers?.status === "streaming";

  const handleButtonClick = useCallback(() => {
    if (isStreaming) {
      chatHelpers?.stop();
    } else {
      handleSubmit();
    }
  }, [isStreaming, chatHelpers, handleSubmit]);

  return (
    <div
      data-slot="rich-prompt-input-root"
      className={cn(
        "aui-rich-prompt-input",
        "relative flex items-end gap-2 rounded-xl border bg-background p-3",
        "focus-within:ring-2 focus-within:ring-ring/20",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      <EditorContent
        editor={editor}
        className="min-h-[1.5rem] max-h-[12rem] flex-1 overflow-y-auto text-sm outline-none [&_.tiptap]:outline-none [&_.tiptap_p]:m-0"
      />

      <button
        type="button"
        data-slot="rich-prompt-input-submit"
        className={cn(
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
          isStreaming
            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            : "bg-primary text-primary-foreground hover:bg-primary/90",
          "disabled:opacity-50 disabled:pointer-events-none",
        )}
        disabled={disabled || (!isStreaming && (!editor || editor.isEmpty))}
        onClick={handleButtonClick}
      >
        {isStreaming ? (
          <SquareIcon className="h-4 w-4" />
        ) : (
          <CornerDownLeftIcon className="h-4 w-4" />
        )}
      </button>

      {/* Suggestion popup portal */}
      {popupState && <SuggestionPortal state={popupState} triggers={triggers} />}
    </div>
  );
}
