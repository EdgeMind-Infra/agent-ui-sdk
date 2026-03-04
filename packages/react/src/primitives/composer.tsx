/**
 * Composer Primitive — Message input area.
 *
 * Provides:
 * - Composer.Root: Form container managing text/attachments state
 * - Composer.Input: Textarea with Enter/Shift+Enter/IME handling
 * - Composer.Send: Submit button (toggles send/stop based on chat status)
 * - Composer.Cancel: Cancel edit mode
 * - Composer.Attachments: Attachment management
 */

import { useAgentUI } from "@agent-ui-sdk/core/react";
import {
  createContext,
  type FormEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

// ---------------------------------------------------------------------------
// Attachment types
// ---------------------------------------------------------------------------

export interface ComposerAttachment {
  id: string;
  file: File;
  name: string;
  mediaType: string;
  /** Blob URL for preview (must be revoked on cleanup) */
  previewUrl?: string;
}

// ---------------------------------------------------------------------------
// Composer Context
// ---------------------------------------------------------------------------

interface ComposerContextValue {
  text: string;
  setText: (text: string) => void;
  attachments: ComposerAttachment[];
  addAttachment: (file: File) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  submit: () => void;
  cancel: () => void;
  isEditing: boolean;
  editMessageId: string | null;
}

const ComposerContext = createContext<ComposerContextValue | null>(null);

export function useComposerContext(): ComposerContextValue {
  const ctx = useContext(ComposerContext);
  if (!ctx) throw new Error("useComposerContext must be used within <Composer.Root>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Composer.Root
// ---------------------------------------------------------------------------

export interface ComposerRootProps extends HTMLAttributes<HTMLFormElement> {
  children: ReactNode;
  /** Initial text value */
  initialText?: string;
  /** Edit mode: editing an existing message */
  editMessageId?: string | null;
  /** Called when cancelling edit mode */
  onCancelEdit?: () => void;
}

export function ComposerRoot({
  children,
  initialText = "",
  editMessageId = null,
  onCancelEdit,
  ...formProps
}: ComposerRootProps) {
  const [text, setText] = useState(initialText);
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const actions = useAgentUI((s) => s.actions);

  const addAttachment = useCallback((file: File) => {
    const attachment: ComposerAttachment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      name: file.name,
      mediaType: file.type,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
    };
    setAttachments((prev) => [...prev, attachment]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id);
      if (att?.previewUrl) URL.revokeObjectURL(att.previewUrl);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments((prev) => {
      for (const att of prev) {
        if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
      }
      return [];
    });
  }, []);

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    if (editMessageId && actions.onEdit) {
      actions.onEdit(editMessageId, trimmed);
    } else if (actions.onNew) {
      actions.onNew({ content: trimmed, attachments });
    }

    setText("");
    clearAttachments();
  }, [text, attachments, editMessageId, actions, clearAttachments]);

  const cancel = useCallback(() => {
    setText("");
    clearAttachments();
    onCancelEdit?.();
  }, [clearAttachments, onCancelEdit]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      submit();
    },
    [submit],
  );

  const ctx: ComposerContextValue = {
    text,
    setText,
    attachments,
    addAttachment,
    removeAttachment,
    clearAttachments,
    submit,
    cancel,
    isEditing: editMessageId !== null,
    editMessageId,
  };

  return (
    <ComposerContext.Provider value={ctx}>
      <form
        data-aui="composer-root"
        className="aui-composer-root"
        onSubmit={handleSubmit}
        {...formProps}
      >
        {children}
      </form>
    </ComposerContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Composer.Input
// ---------------------------------------------------------------------------

export interface ComposerInputProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  /** Auto-resize textarea to fit content */
  autoResize?: boolean;
}

export function ComposerInput({
  autoResize = true,
  onKeyDown,
  onPaste,
  ...props
}: ComposerInputProps) {
  const { text, setText, submit, attachments, removeAttachment, addAttachment } =
    useComposerContext();
  const composingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(e);
      if (e.defaultPrevented) return;

      // IME composition: don't submit during composition
      if (composingRef.current) return;

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submit();
        return;
      }

      // Backspace removes last attachment when input is empty
      if (e.key === "Backspace" && text === "" && attachments.length > 0) {
        const lastAttachment = attachments[attachments.length - 1];
        if (lastAttachment) removeAttachment(lastAttachment.id);
      }
    },
    [onKeyDown, submit, text, attachments, removeAttachment],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    },
    [setText, autoResize],
  );

  return (
    <textarea
      ref={textareaRef}
      data-aui="composer-input"
      className="aui-composer-input"
      value={text}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={() => {
        composingRef.current = false;
      }}
      onPaste={(e) => {
        onPaste?.(e);
        // Handle pasted files
        const items = e.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.kind === "file") {
              const file = item.getAsFile();
              if (file) addAttachment(file);
            }
          }
        }
      }}
      rows={1}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Composer.Send
// ---------------------------------------------------------------------------

export interface ComposerSendProps extends HTMLAttributes<HTMLButtonElement> {
  /** Content when chat is idle (ready to send) */
  children?: ReactNode;
  /** Content when chat is running (show stop icon) */
  stopChildren?: ReactNode;
}

export function ComposerSend({ children, stopChildren, ...props }: ComposerSendProps) {
  const isRunning = useAgentUI((s) => s.isRunning);
  const stopAction = useAgentUI((s) => s.actions.onCancel);

  if (isRunning) {
    return (
      <button
        type="button"
        data-aui="composer-stop"
        className="aui-composer-stop"
        onClick={stopAction}
        {...props}
      >
        {stopChildren ?? "Stop"}
      </button>
    );
  }

  return (
    <button type="submit" data-aui="composer-send" className="aui-composer-send" {...props}>
      {children ?? "Send"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Composer.Cancel
// ---------------------------------------------------------------------------

export interface ComposerCancelProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}

export function ComposerCancel({ children, ...props }: ComposerCancelProps) {
  const { cancel, isEditing } = useComposerContext();

  if (!isEditing) return null;

  return (
    <button
      type="button"
      data-aui="composer-cancel"
      className="aui-composer-cancel"
      onClick={cancel}
      {...props}
    >
      {children ?? "Cancel"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Composer = {
  Root: ComposerRoot,
  Input: ComposerInput,
  Send: ComposerSend,
  Cancel: ComposerCancel,
};
