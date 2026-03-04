/**
 * Composer Primitive (React Native) — Message input area.
 *
 * - Composer.Root: Container managing text/attachments state
 * - Composer.Input: TextInput with submit-on-return
 * - Composer.Send: Submit Pressable (toggles send/stop)
 * - Composer.Cancel: Cancel edit mode
 */

import { useAgentUI } from "@agent-ui-sdk/core/react";
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import {
  type NativeSyntheticEvent,
  Pressable,
  type StyleProp,
  Text,
  TextInput,
  type TextInputProps,
  type TextInputSubmitEditingEventData,
  View,
  type ViewStyle,
} from "react-native";

// ---------------------------------------------------------------------------
// Attachment types
// ---------------------------------------------------------------------------

export interface ComposerAttachment {
  id: string;
  name: string;
  mediaType: string;
  /** URI for the file (e.g., content://, file://) */
  uri?: string;
}

// ---------------------------------------------------------------------------
// Composer Context
// ---------------------------------------------------------------------------

interface ComposerContextValue {
  text: string;
  setText: (text: string) => void;
  attachments: ComposerAttachment[];
  addAttachment: (attachment: ComposerAttachment) => void;
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

export interface ComposerRootProps {
  children: ReactNode;
  initialText?: string;
  editMessageId?: string | null;
  onCancelEdit?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function ComposerRoot({
  children,
  initialText = "",
  editMessageId = null,
  onCancelEdit,
  style,
}: ComposerRootProps) {
  const [text, setText] = useState(initialText);
  const [attachments, setAttachments] = useState<ComposerAttachment[]>([]);
  const actions = useAgentUI((s) => s.actions);

  const addAttachment = useCallback((attachment: ComposerAttachment) => {
    setAttachments((prev) => [...prev, attachment]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
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
      <View style={style} testID="aui-composer-root">
        {children}
      </View>
    </ComposerContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Composer.Input
// ---------------------------------------------------------------------------

export interface ComposerInputProps extends Omit<TextInputProps, "value" | "onChangeText"> {
  /** Submit on return key (default: true) */
  submitOnReturn?: boolean;
}

export function ComposerInput({ submitOnReturn = true, ...props }: ComposerInputProps) {
  const { text, setText, submit } = useComposerContext();

  const handleSubmitEditing = useCallback(
    (_e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
      if (submitOnReturn) submit();
    },
    [submit, submitOnReturn],
  );

  return (
    <TextInput
      value={text}
      onChangeText={setText}
      onSubmitEditing={handleSubmitEditing}
      blurOnSubmit={false}
      returnKeyType="send"
      multiline
      testID="aui-composer-input"
      accessibilityLabel="Message input"
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Composer.Send
// ---------------------------------------------------------------------------

export interface ComposerSendProps {
  children?: ReactNode;
  stopChildren?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ComposerSend({ children, stopChildren, style }: ComposerSendProps) {
  const isRunning = useAgentUI((s) => s.isRunning);
  const stopAction = useAgentUI((s) => s.actions.onCancel);
  const { submit } = useComposerContext();

  if (isRunning) {
    return (
      <Pressable
        onPress={stopAction}
        style={style}
        testID="aui-composer-stop"
        accessibilityRole="button"
        accessibilityLabel="Stop generation"
      >
        {stopChildren ?? <Text>Stop</Text>}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={submit}
      style={style}
      testID="aui-composer-send"
      accessibilityRole="button"
      accessibilityLabel="Send message"
    >
      {children ?? <Text>Send</Text>}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Composer.Cancel
// ---------------------------------------------------------------------------

export interface ComposerCancelProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ComposerCancel({ children, style }: ComposerCancelProps) {
  const { cancel, isEditing } = useComposerContext();

  if (!isEditing) return null;

  return (
    <Pressable
      onPress={cancel}
      style={style}
      testID="aui-composer-cancel"
      accessibilityRole="button"
      accessibilityLabel="Cancel edit"
    >
      {children ?? <Text>Cancel</Text>}
    </Pressable>
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
