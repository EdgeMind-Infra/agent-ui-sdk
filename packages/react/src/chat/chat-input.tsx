"use client";

import { BrainIcon, CheckIcon, GlobeIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "src/components/ai-elements/attachments";
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
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "src/components/ai-elements/prompt-input";
import { SpeechInput } from "src/components/ai-elements/speech-input";
import { Suggestion, Suggestions } from "src/components/ai-elements/suggestion";
import { cn } from "src/lib/utils";
import type { ChatInputProps, ModelConfig } from "../types";
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

export function ChatInput({ className }: ChatInputProps) {
  const { chatHelpers, config } = useChatContext();
  const { sendMessage, stop, status } = chatHelpers;
  const [text, setText] = useState("");
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

  const {
    suggestions,
    onSuggestionClick,
    models,
    selectedModel,
    onModelChange,
    enableAttachments,
    enableSpeechInput,
    onAudioRecorded,
    enableThinking,
    thinkingActive,
    onThinkingToggle,
    enableWebSearch,
    webSearchActive,
    onWebSearchToggle,
    toolbarExtras,
  } = config;

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

  const handleSubmit = useCallback(
    (message: PromptInputMessage) => {
      const hasText = Boolean(message.text);
      const hasFiles = Boolean(message.files?.length);
      if (!(hasText || hasFiles)) return;
      sendMessage({ text: message.text, files: message.files });
      setText("");
    },
    [sendMessage],
  );

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

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

  const handleTranscriptionChange = useCallback((transcript: string) => {
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
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

  const hasTools =
    enableAttachments ||
    enableSpeechInput ||
    enableThinking ||
    enableWebSearch ||
    toolbarExtras ||
    (models && models.length > 0);

  return (
    <div className={cn("grid shrink-0 gap-4 pt-4", className)}>
      {suggestions && suggestions.length > 0 && (
        <Suggestions className="px-4">
          {suggestions.map((suggestion) => (
            <SuggestionItem
              key={suggestion}
              onClick={handleSuggestionClick}
              suggestion={suggestion}
            />
          ))}
        </Suggestions>
      )}
      <div className="w-full px-4 pb-4">
        <PromptInput
          globalDrop={enableAttachments}
          multiple={enableAttachments}
          onSubmit={handleSubmit}
        >
          {enableAttachments && (
            <PromptInputHeader>
              <AttachmentsDisplay />
            </PromptInputHeader>
          )}
          <PromptInputBody>
            <PromptInputTextarea
              value={text}
              onChange={handleTextChange}
              placeholder="Type a message..."
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
                {enableSpeechInput && (
                  <SpeechInput
                    className="shrink-0"
                    onTranscriptionChange={handleTranscriptionChange}
                    onAudioRecorded={onAudioRecorded}
                    size="icon-sm"
                    variant="ghost"
                  />
                )}
                {enableThinking && (
                  <PromptInputButton
                    onClick={handleThinkingToggle}
                    variant={thinkingActive ? "default" : "ghost"}
                  >
                    <BrainIcon size={16} />
                    <span>Think</span>
                  </PromptInputButton>
                )}
                {enableWebSearch && (
                  <PromptInputButton
                    onClick={handleWebSearchToggle}
                    variant={webSearchActive ? "default" : "ghost"}
                  >
                    <GlobeIcon size={16} />
                    <span>Search</span>
                  </PromptInputButton>
                )}
                {toolbarExtras}
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
                      <ModelSelectorInput placeholder="Search models..." />
                      <ModelSelectorList>
                        <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
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
            <PromptInputSubmit
              disabled={!text.trim() && status !== "streaming" && status !== "submitted"}
              status={status}
              onStop={stop}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
