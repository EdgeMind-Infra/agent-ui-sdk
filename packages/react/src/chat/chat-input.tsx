"use client";

import { createFallbackDictationAdapter } from "@agent-ui-sdk/core";
import { BrainIcon, CheckIcon, GlobeIcon } from "lucide-react";
import { useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "src/components/ai-elements/attachments";
import { DictationButton } from "src/components/ai-elements/dictation-button";
import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "src/components/ai-elements/model-selector";
import type { PromptInputMessage } from "src/components/ai-elements/prompt-input";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTools,
  usePromptInputAttachments,
} from "src/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "src/components/ai-elements/suggestion";
import { cn } from "src/lib/utils";
import { RichPromptInput } from "../components/ai-elements/rich-prompt-input";
import type { ChatInputHandle, RichPromptInputHandle, RichPromptInputSubmitPayload } from "../types";
import { type ChatInputProps, DEFAULT_CHAT_LABELS, type ModelConfig } from "../types";
import { useChatContext } from "./chat-provider";

// ============================================================================
// Internal sub-components
// ============================================================================

function AttachmentItem({
  attachment,
  onRemove,
}: {
  attachment: import("src/components/ai-elements/attachments").AttachmentData;
  onRemove: (id: string) => void;
}) {
  const handleRemove = useCallback(() => {
    onRemove(attachment.id);
  }, [onRemove, attachment.id]);

  return (
    <Attachment data={attachment} onRemove={handleRemove}>
      <AttachmentPreview />
      <AttachmentRemove />
    </Attachment>
  );
}

function AttachmentsDisplay() {
  const attachments = usePromptInputAttachments();

  const handleRemove = useCallback(
    (id: string) => {
      attachments.remove(id);
    },
    [attachments],
  );

  if (attachments.files.length === 0) {
    return null;
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <AttachmentItem attachment={attachment} key={attachment.id} onRemove={handleRemove} />
      ))}
    </Attachments>
  );
}

function SuggestionItem({
  suggestion,
  onClick,
}: {
  suggestion: string;
  onClick: (suggestion: string) => void;
}) {
  const handleClick = useCallback(() => {
    onClick(suggestion);
  }, [onClick, suggestion]);

  return <Suggestion onClick={handleClick} suggestion={suggestion} />;
}

function ModelItem({
  model,
  isSelected,
  onSelect,
}: {
  model: ModelConfig;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const handleSelect = useCallback(() => {
    onSelect(model.id);
  }, [onSelect, model.id]);

  return (
    <ModelSelectorItem onSelect={handleSelect} value={model.id}>
      <ModelSelectorLogo provider={model.provider} />
      <ModelSelectorName>{model.name}</ModelSelectorName>
      {model.providers && model.providers.length > 0 && (
        <ModelSelectorLogoGroup>
          {model.providers.map((provider) => (
            <ModelSelectorLogo key={provider} provider={provider} />
          ))}
        </ModelSelectorLogoGroup>
      )}
      {isSelected ? <CheckIcon className="ml-auto size-4" /> : <div className="ml-auto size-4" />}
    </ModelSelectorItem>
  );
}

// ============================================================================
// ChatInput
// ============================================================================

export function ChatInput({ className, ref }: ChatInputProps) {
  const { chatHelpers, config } = useChatContext();
  const { sendMessage, stop: rawStop, status } = chatHelpers;
  const labels = { ...DEFAULT_CHAT_LABELS, ...config.labels };

  const stop = useCallback(() => {
    rawStop();
    config.onStop?.();
  }, [rawStop, config.onStop]);
  const richInputRef = useRef<RichPromptInputHandle>(null);
  const [editorEmpty, setEditorEmpty] = useState(true);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

  useImperativeHandle(
    ref,
    () => ({
      insertText: (text: string) => {
        richInputRef.current?.insertText(text);
      },
      setContent: (text: string) => {
        richInputRef.current?.setContent(text);
      },
      focus: () => {
        richInputRef.current?.focus();
      },
    }),
    [],
  );

  const {
    suggestions,
    onSuggestionClick,
    models,
    selectedModel,
    onModelChange,
    enableAttachments,
    dictationAdapter: dictationAdapterProp,
    enableSpeechInput,
    onAudioRecorded,
    enableThinking,
    thinkingActive,
    onThinkingToggle,
    enableWebSearch,
    webSearchActive,
    onWebSearchToggle,
    triggers,
    headerContent,
    toolbarExtras,
    toolbarRight,
  } = config;

  // Resolve dictation adapter: explicit prop > backward-compat fallback
  const dictationAdapter = useMemo(() => {
    if (dictationAdapterProp) return dictationAdapterProp;
    if (enableSpeechInput === false) return undefined;
    if (onAudioRecorded) {
      return createFallbackDictationAdapter({ transcribe: onAudioRecorded });
    }
    return undefined;
  }, [dictationAdapterProp, enableSpeechInput, onAudioRecorded]);

  const selectedModelData = useMemo(
    () => models?.find((m) => m.id === selectedModel),
    [models, selectedModel],
  );

  const modelGroups = useMemo(() => {
    if (!models) return [];
    const groups = new Map<string, ModelConfig[]>();
    for (const model of models) {
      const group = model.group ?? model.provider;
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(model);
    }
    return Array.from(groups.entries());
  }, [models]);

  // Form submit handler — PromptInput calls this on form submit (button click).
  // Since TipTap is a contenteditable div (not a form control), FormData won't
  // contain the text. We delegate to RichPromptInput's submit() via ref.
  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const hasFiles = Boolean(message.files?.length);

      // Trigger TipTap's internal submit (serializes content + calls onSubmit prop)
      richInputRef.current?.submit();

      // Also send files if any (independently of TipTap text)
      if (hasFiles) {
        sendMessage({ text: "", files: message.files });
      }
    },
    [sendMessage],
  );

  // Handler for RichPromptInput's onSubmit prop — called by Enter key or ref.submit()
  const handleRichSubmit = useCallback(
    (payload: RichPromptInputSubmitPayload) => {
      if (!payload.text) return;
      sendMessage({ text: payload.text });
    },
    [sendMessage],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (onSuggestionClick) {
        onSuggestionClick(suggestion);
      } else {
        sendMessage({ text: suggestion });
      }
    },
    [onSuggestionClick, sendMessage],
  );

  const handleTranscriptionComplete = useCallback((transcript: string) => {
    richInputRef.current?.insertText(transcript);
    richInputRef.current?.focus();
  }, []);

  const handleThinkingToggle = useCallback(() => {
    onThinkingToggle?.(!thinkingActive);
  }, [onThinkingToggle, thinkingActive]);

  const handleWebSearchToggle = useCallback(() => {
    onWebSearchToggle?.(!webSearchActive);
  }, [onWebSearchToggle, webSearchActive]);

  const handleModelSelect = useCallback(
    (modelId: string) => {
      onModelChange?.(modelId);
      setModelSelectorOpen(false);
    },
    [onModelChange],
  );

  const inputHelpers = useMemo(
    () => ({
      insertCommandTag: (attrs: { id: string; label: string; refType?: string }) => {
        richInputRef.current?.insertCommandTag(attrs);
      },
    }),
    [],
  );

  const hasTools =
    enableAttachments ||
    enableThinking ||
    enableWebSearch ||
    toolbarExtras ||
    (models && models.length > 0);

  return (
    <div className={cn("shrink-0 pb-3", className)}>
      {suggestions && suggestions.length > 0 && (
        <Suggestions className="mx-auto w-full max-w-3xl px-5">
          {suggestions.map((suggestion) => (
            <SuggestionItem
              key={suggestion}
              onClick={handleSuggestionClick}
              suggestion={suggestion}
            />
          ))}
        </Suggestions>
      )}
      <div className="mx-auto w-full max-w-3xl px-5">
        <PromptInput
          globalDrop={enableAttachments}
          multiple={enableAttachments}
          onSubmit={handleSubmit}
        >
          {headerContent && <PromptInputHeader>{headerContent}</PromptInputHeader>}
          {enableAttachments && (
            <PromptInputHeader>
              <AttachmentsDisplay />
            </PromptInputHeader>
          )}
          <PromptInputBody>
            <RichPromptInput
              ref={richInputRef}
              triggers={triggers}
              placeholder={labels.placeholder}
              onSubmit={handleRichSubmit}
              onEmptyChange={setEditorEmpty}
              disabled={false}
              autoFocus
              embedded
            />
          </PromptInputBody>
          <PromptInputFooter>
            {hasTools ? (
              <PromptInputTools>
                {enableAttachments && (
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger />
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>
                )}
                {enableThinking && (
                  <PromptInputButton
                    onClick={handleThinkingToggle}
                    variant={thinkingActive ? "default" : "ghost"}
                    tooltip={labels.think}
                  >
                    <BrainIcon size={16} />
                  </PromptInputButton>
                )}
                {enableWebSearch && (
                  <PromptInputButton
                    onClick={handleWebSearchToggle}
                    variant={webSearchActive ? "default" : "ghost"}
                    tooltip={labels.search}
                  >
                    <GlobeIcon size={16} />
                  </PromptInputButton>
                )}
                {typeof toolbarExtras === "function" ? toolbarExtras(inputHelpers) : toolbarExtras}
                {models && models.length > 0 && (
                  <ModelSelector onOpenChange={setModelSelectorOpen} open={modelSelectorOpen}>
                    <ModelSelectorTrigger asChild>
                      <PromptInputButton>
                        {selectedModelData?.provider && (
                          <ModelSelectorLogo provider={selectedModelData.provider} />
                        )}
                        {selectedModelData?.name && (
                          <ModelSelectorName>{selectedModelData.name}</ModelSelectorName>
                        )}
                      </PromptInputButton>
                    </ModelSelectorTrigger>
                    <ModelSelectorContent>
                      <ModelSelectorInput placeholder={labels.searchModels} />
                      <ModelSelectorList>
                        <ModelSelectorEmpty>{labels.noModelsFound}</ModelSelectorEmpty>
                        {modelGroups.map(([group, groupModels]) => (
                          <ModelSelectorGroup heading={group} key={group}>
                            {groupModels.map((m) => (
                              <ModelItem
                                isSelected={selectedModel === m.id}
                                key={m.id}
                                model={m}
                                onSelect={handleModelSelect}
                              />
                            ))}
                          </ModelSelectorGroup>
                        ))}
                      </ModelSelectorList>
                    </ModelSelectorContent>
                  </ModelSelector>
                )}
              </PromptInputTools>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-1">
              {toolbarRight}
              {dictationAdapter && (
                <DictationButton
                  adapter={dictationAdapter}
                  className="shrink-0"
                  onResult={handleTranscriptionComplete}
                  size="icon-sm"
                  tooltip={labels.voiceInput}
                  variant="ghost"
                />
              )}
              <PromptInputSubmit
                disabled={editorEmpty && status !== "streaming" && status !== "submitted"}
                status={status}
                onStop={stop}
                tooltip={labels.send}
              />
            </div>
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
