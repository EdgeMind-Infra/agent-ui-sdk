import { Extension } from "@tiptap/core";

export interface SubmitOnEnterOptions {
  onSubmit: () => void;
  /** Returns true if a suggestion popup is currently open. */
  isSuggestionOpen: () => boolean;
}

export const SubmitOnEnter = Extension.create<SubmitOnEnterOptions>({
  name: "submitOnEnter",

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        if (this.options.isSuggestionOpen()) {
          // Let the suggestion plugin handle Enter
          return false;
        }
        this.options.onSubmit();
        return true;
      },
      "Shift-Enter": () => {
        return this.editor.commands.first(({ commands }) => [
          () => commands.newlineInCode(),
          () => commands.splitBlock(),
        ]);
      },
    };
  },
});
