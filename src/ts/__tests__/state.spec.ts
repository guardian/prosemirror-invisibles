import createInvisiblesPlugin, { pluginKey } from "../";
import space from "invisibles/space";
import { addListNodes } from "prosemirror-schema-list";
import { schema } from "prosemirror-schema-basic";
import { Schema, DOMParser } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import hardBreak from "invisibles/hard-break";
import paragraph from "invisibles/paragraph";
import { commands } from "state";

const testSchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
  marks: schema.spec.marks,
});

const createEditor = (htmlDoc: string, isActive: boolean) => {
  const contentElement = document.createElement("content");
  contentElement.innerHTML = htmlDoc;
  return new EditorView(undefined, {
    state: EditorState.create({
      doc: DOMParser.fromSchema(testSchema).parse(contentElement),
      plugins: [createInvisiblesPlugin([hardBreak(), paragraph(), space()], isActive)],
    }),
  });
};

const getDocDecorations = (editor: EditorView) => editor.someProp("decorations")(editor.state).find()

describe("State management", () => {
  describe("Active state", () => {
    it("should set the active state initially", () => {
      const editor = createEditor("<p>Example doc</p>", false);

      const pluginState = pluginKey.getState(editor.state)
      expect(pluginState?.isActive).toBe(false)
    });
    it("should provide a command to set the active state of the plugin", () => {
      const editor = createEditor("<p>Example doc</p>", true);
      commands.setActiveState(false)(editor.state, editor.dispatch)

      const pluginState = pluginKey.getState(editor.state)
      expect(pluginState?.isActive).toBe(false)
    });
    it("should show decorations when the active state is true", () => {
      const editor = createEditor("<p>Example doc with four spaces</p>", true);

      const currentDecorations = getDocDecorations(editor)
      expect(currentDecorations?.length).toBe(5)
    });
    it("should hide decorations when the active state is false", () => {
      const editor = createEditor("<p>Example doc with four spaces</p>", false);

      const currentDecorations = getDocDecorations(editor)
      expect(currentDecorations?.length).toBe(0)
    });
  });
});
