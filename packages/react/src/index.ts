// @agent-ui-sdk/react
// React web bindings for Agent UI SDK
//
// Core types/functions: import from "@agent-ui-sdk/core"
// Store/Provider/Hooks: import from "@agent-ui-sdk/core/react"
// AI SDK bridge:        import from "@agent-ui-sdk/core/ai-sdk"

// Primitives (Web-specific)
export {
  // ActionBar
  ActionBar,
  type ApprovalState,
  // Attachment
  Attachment,
  type AttachmentData,
  Attachments,
  type AttachmentVariant,
  // BranchPicker
  BranchPicker,
  // CodeBlock
  CodeBlock,
  // Composer
  Composer,
  type ComposerAttachment,
  // Confirmation
  Confirmation,
  getMediaCategory,
  loadStreamdownPlugins,
  // MarkdownRenderer
  MarkdownRenderer,
  type MediaCategory,
  // Message
  Message,
  type PartComponentMap,
  // Reasoning
  Reasoning,
  // Thread
  Thread,
  // ToolCall
  ToolCall,
  ToolGroup,
  useAttachmentContext,
  useComposerContext,
  useConfirmationContext,
  useMessageContext,
  useReasoningContext,
  useThreadContext,
  useToolCallContext,
} from "./primitives";
