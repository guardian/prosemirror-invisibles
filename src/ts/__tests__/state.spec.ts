import { TextSelection } from "prosemirror-state";
import { DecorationSet, EditorView } from "prosemirror-view";
import { commands, pluginKey } from "state";
import { createEditor } from "./helpers";

const getDocDecorations = (editor: EditorView) =>
  (editor.someProp("decorations")?.(editor.state) as DecorationSet).find();

describe("State management", () => {
  describe("Active state", () => {
    it("should set the active state initially", () => {
      const editor = createEditor("<p>Example doc</p>", false);

      const pluginState = pluginKey.getState(editor.state);
      expect(pluginState?.isActive).toBe(false);
    });
    it("should provide a command to set the active state of the plugin", () => {
      const editor = createEditor("<p>Example doc</p>", true);
      commands.setActiveState(false)(editor.state, editor.dispatch);

      const pluginState = pluginKey.getState(editor.state);
      expect(pluginState?.isActive).toBe(false);
    });
    it("should show decorations when the active state is true", () => {
      const editor = createEditor("<p>Example doc with four spaces</p>", true);

      const currentDecorations = getDocDecorations(editor);
      expect(currentDecorations?.length).toBe(5);
    });
    it("should hide decorations when the active state is false", () => {
      const editor = createEditor("<p>Example doc with four spaces</p>", false);

      const currentDecorations = getDocDecorations(editor);
      expect(currentDecorations?.length).toBe(0);
    });
    it("should reset the document selection when the state changes", () => {
      const editor = createEditor("<p>Example doc with four spaces</p>", true);

      editor.dispatch(
        editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 15))
      );
      commands.setActiveState(false)(editor.state, editor.dispatch);

      expect(editor.state.selection.from).toBe(0);

      editor.dispatch(
        editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 15))
      );
      commands.setActiveState(true)(editor.state, editor.dispatch);

      expect(editor.state.selection.from).toBe(0);
    });
  });
});
