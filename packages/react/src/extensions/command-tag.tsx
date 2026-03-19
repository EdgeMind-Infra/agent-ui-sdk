"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { SparklesIcon, TerminalSquareIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { CommandNodeRenderProps } from "../types";

// ============================================================================
// NodeView component
// ============================================================================

function CommandTagNodeView(props: { node: any; deleteNode: () => void; extension: any }) {
  const { node, deleteNode, extension } = props;
  const renderNode = extension.options.renderNode as
    | ((props: CommandNodeRenderProps) => ReactNode)
    | undefined;

  const nodeProps: CommandNodeRenderProps = {
    id: node.attrs.id ?? "",
    label: node.attrs.label ?? "",
    onDelete: deleteNode,
  };

  const refType = node.attrs.refType ?? "command";
  const Icon = refType === "skill" ? SparklesIcon : TerminalSquareIcon;

  return (
    <NodeViewWrapper as="span" className="align-middle" data-slot="command-tag" contentEditable={false}>
      {renderNode ? (
        renderNode(nodeProps)
      ) : (
        <span className="inline-flex items-center gap-1 rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[0.85em] font-medium leading-none text-violet-600 dark:text-violet-400">
          <Icon className="size-3.5" />
          {nodeProps.label}
        </span>
      )}
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
      refType: { default: null },
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
