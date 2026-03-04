/**
 * Attachment Primitive — File attachment display and management.
 *
 * Provides:
 * - Attachments: Container with layout variants (grid/inline/list)
 * - Attachment.Root: Single attachment with context
 * - Attachment.Preview: Image preview / icon fallback
 * - Attachment.Info: Filename + mediaType
 * - Attachment.Remove: Delete button with blob URL cleanup
 */

import { createContext, type HTMLAttributes, type ReactNode, useCallback, useContext } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AttachmentVariant = "grid" | "inline" | "list";
export type MediaCategory = "image" | "video" | "audio" | "document" | "unknown";

export interface AttachmentData {
  id: string;
  name: string;
  mediaType: string;
  url?: string;
  size?: number;
}

// ---------------------------------------------------------------------------
// getMediaCategory utility
// ---------------------------------------------------------------------------

export function getMediaCategory(mediaType: string): MediaCategory {
  if (mediaType.startsWith("image/")) return "image";
  if (mediaType.startsWith("video/")) return "video";
  if (mediaType.startsWith("audio/")) return "audio";
  if (mediaType.startsWith("application/") || mediaType.startsWith("text/")) return "document";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Attachments Container Context
// ---------------------------------------------------------------------------

interface AttachmentsContextValue {
  variant: AttachmentVariant;
}

const AttachmentsContext = createContext<AttachmentsContextValue>({ variant: "grid" });

export interface AttachmentsProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: AttachmentVariant;
}

export function Attachments({ children, variant = "grid", ...props }: AttachmentsProps) {
  return (
    <AttachmentsContext.Provider value={{ variant }}>
      <div
        data-aui="attachments"
        data-variant={variant}
        className={`aui-attachments aui-attachments-${variant}`}
        {...props}
      >
        {children}
      </div>
    </AttachmentsContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Attachment Context
// ---------------------------------------------------------------------------

interface AttachmentContextValue {
  data: AttachmentData;
  mediaCategory: MediaCategory;
  variant: AttachmentVariant;
  onRemove?: () => void;
}

const AttachmentContext = createContext<AttachmentContextValue | null>(null);

export function useAttachmentContext(): AttachmentContextValue {
  const ctx = useContext(AttachmentContext);
  if (!ctx) throw new Error("useAttachmentContext must be used within <Attachment.Root>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Attachment.Root
// ---------------------------------------------------------------------------

export interface AttachmentRootProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  data: AttachmentData;
  /** Called when remove is triggered */
  onRemove?: () => void;
}

export function AttachmentRoot({ children, data, onRemove, ...props }: AttachmentRootProps) {
  const { variant } = useContext(AttachmentsContext);
  const mediaCategory = getMediaCategory(data.mediaType);

  const ctx: AttachmentContextValue = { data, mediaCategory, variant, onRemove };

  return (
    <AttachmentContext.Provider value={ctx}>
      <div
        data-aui="attachment-root"
        data-media-category={mediaCategory}
        data-variant={variant}
        className="aui-attachment-root"
        {...props}
      >
        {children}
      </div>
    </AttachmentContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Attachment.Preview
// ---------------------------------------------------------------------------

export interface AttachmentPreviewProps extends HTMLAttributes<HTMLDivElement> {
  /** Fallback icon/element for non-image attachments */
  fallback?: ReactNode;
}

export function AttachmentPreview({ fallback, ...props }: AttachmentPreviewProps) {
  const { data, mediaCategory } = useAttachmentContext();

  if (mediaCategory === "image" && data.url) {
    return (
      <div data-aui="attachment-preview" className="aui-attachment-preview" {...props}>
        <img src={data.url} alt={data.name} className="aui-attachment-image" />
      </div>
    );
  }

  return (
    <div
      data-aui="attachment-preview"
      data-fallback="true"
      className="aui-attachment-preview"
      {...props}
    >
      {fallback ?? <span className="aui-attachment-icon">{mediaCategory}</span>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attachment.Info
// ---------------------------------------------------------------------------

export interface AttachmentInfoProps extends HTMLAttributes<HTMLDivElement> {}

export function AttachmentInfo(props: AttachmentInfoProps) {
  const { data } = useAttachmentContext();

  return (
    <div data-aui="attachment-info" className="aui-attachment-info" {...props}>
      <span className="aui-attachment-name">{data.name}</span>
      <span className="aui-attachment-type">{data.mediaType}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Attachment.Remove
// ---------------------------------------------------------------------------

export interface AttachmentRemoveProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
}

export function AttachmentRemove({ children, ...props }: AttachmentRemoveProps) {
  const { data, onRemove } = useAttachmentContext();

  const handleRemove = useCallback(() => {
    // Revoke blob URL to prevent memory leaks
    if (data.url?.startsWith("blob:")) {
      URL.revokeObjectURL(data.url);
    }
    onRemove?.();
  }, [data.url, onRemove]);

  if (!onRemove) return null;

  return (
    <button
      type="button"
      data-aui="attachment-remove"
      className="aui-attachment-remove"
      onClick={handleRemove}
      {...props}
    >
      {children ?? "×"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------

export const Attachment = {
  Root: AttachmentRoot,
  Preview: AttachmentPreview,
  Info: AttachmentInfo,
  Remove: AttachmentRemove,
};
