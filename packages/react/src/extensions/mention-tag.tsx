"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { FileCodeIcon, FileTextIcon, GlobeIcon, ImageIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { CommandNodeRenderProps } from "../types";

// ============================================================================
// Icon mapping by refType
// ============================================================================

const MENTION_ICONS: Record<string, typeof FileTextIcon> = {
  file: FileTextIcon,
  image: ImageIcon,
  code: FileCodeIcon,
  doc: FileTextIcon,
  url: GlobeIcon,
};

// ============================================================================
// NodeView component
// ============================================================================

function MentionTagNodeView(props: { node: any; deleteNode: () => void; extension: any }) {
  const { node, deleteNode, extension } = props;
  const renderNode = extension.options.renderNode as
    | ((props: CommandNodeRenderProps) => ReactNode)
    | undefined;

  const nodeProps: CommandNodeRenderProps = {
    id: node.attrs.id ?? "",
    label: node.attrs.label ?? "",
    onDelete: deleteNode,
  };

  const refType: string = node.attrs.refType ?? "file";
  const Icon = MENTION_ICONS[refType] ?? FileTextIcon;

  return (
    <NodeViewWrapper as="span" className="align-middle" data-slot="mention-tag" contentEditable={false}>
      {renderNode ? (
        renderNode(nodeProps)
      ) : (
        <span className="group/chip relative inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-[0.85em] font-medium leading-none text-primary transition-colors hover:bg-primary/20">
          <Icon className="size-3.5" />
          {nodeProps.label}
          <button
            type="button"
            className="absolute -right-1.5 -top-1.5 flex size-3.5 scale-0 cursor-pointer items-center justify-center rounded-full border-0 bg-muted-foreground/80 p-0 text-background transition-transform group-hover/chip:scale-100"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              deleteNode();
            }}
          >
            <XIcon className="size-2.5" />
          </button>
        </span>
      )}
    </NodeViewWrapper>
  );
}

// ============================================================================
// Extension
// ============================================================================

export interface MentionTagOptions {
  HTMLAttributes: Record<string, unknown>;
  renderNode?: (props: CommandNodeRenderProps) => ReactNode;
}

export const MentionTag = Node.create<MentionTagOptions>({
  name: "mentionTag",
  group: "inline",
  inline: true,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        "data-slot": "mention-tag",
      },
      renderNode: undefined,
    };
  },

  addAttributes() {
    return {
      id: { default: null },
      label: { default: null },
      refType: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="mention-tag"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, { "data-type": "mention-tag" }, HTMLAttributes),
    ];
  },

  renderText({ node }) {
    return `@${node.attrs.label}`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(MentionTagNodeView);
  },
});
