import { Extension } from "@tiptap/core";
import { PluginKey } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import type { SuggestionOptions } from "@tiptap/suggestion";

export const SlashCommandPluginKey = new PluginKey("slashCommand");

export interface SlashCommandOptions {
  suggestion: Omit<SuggestionOptions, "editor">;
}

export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        startOfLine: false,
        pluginKey: SlashCommandPluginKey,
        command: ({ editor, range, props }) => {
          // Delete the trigger text (e.g., "/search")
          editor.chain().focus().deleteRange(range).run();
          // Call the onSelect handler with the selected item
          props?.onSelect?.(props.item);
        },
        items: () => [],
        render: () => ({}),
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
