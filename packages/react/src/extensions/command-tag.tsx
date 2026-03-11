"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { ReactNode } from "react";
import type { CommandNodeRenderProps } from "../types";

// ============================================================================
// NodeView component
// ============================================================================

function CommandTagNodeView(props: {
  node: any;
  deleteNode: () => void;
  extension: any;
}) {
  const { node, deleteNode, extension } = props;
  const renderNode = extension.options.renderNode as
    | ((props: CommandNodeRenderProps) => ReactNode)
    | undefined;

  const nodeProps: CommandNodeRenderProps = {
    id: node.attrs.id ?? "",
    label: node.attrs.label ?? "",
    onDelete: deleteNode,
  };

  return (
    <NodeViewWrapper as="span" data-slot="command-tag" contentEditable={false}>
      {renderNode ? renderNode(nodeProps) : <span>/{nodeProps.label}</span>}
    </NodeViewWrapper>
  );
}

// ============================================================================
// Extension
// ============================================================================

export interface CommandTagOptions {
  HTMLAttributes: Record<string, unknown>;
  renderNode?: (props: CommandNodeRenderProps) => ReactNode;
}

export const CommandTag = Node.create<CommandTagOptions>({
  name: "commandTag",
  group: "inline",
  inline: true,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        "data-slot": "command-tag",
      },
      renderNode: undefined,
    };
  },

  addAttributes() {
    return {
      id: { default: null },
      label: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-type="command-tag"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, { "data-type": "command-tag" }, HTMLAttributes),
    ];
  },

  renderText({ node }) {
    return `/${node.attrs.label}`;
  },

  addNodeView() {
    return ReactNodeViewRenderer(CommandTagNodeView);
  },
});
