import { createInvisiblesPlugin } from "../";
import space from "../invisibles/space";
import { addListNodes } from "prosemirror-schema-list";
import { schema } from "prosemirror-schema-basic";
import { Schema, DOMParser } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { DecorationSet, EditorView } from "prosemirror-view";
import hardBreak from "../invisibles/hard-break";
import paragraph from "../invisibles/paragraph";
import nbSpace from "../invisibles/nbSpace"
import heading from "../invisibles/heading";
import { commands, pluginKey } from "../state";
import AddDecorationsForInvisible from "../utils/invisible";

const testSchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
  marks: schema.spec.marks,
});


const createEditor = (invisibleType: AddDecorationsForInvisible[], htmlDoc: string, shouldShowInvisibles: boolean) => {
  const contentElement = document.createElement("content");
  contentElement.innerHTML = htmlDoc;
  return new EditorView(contentElement, {
    state: EditorState.create({
      doc: DOMParser.fromSchema(testSchema).parse(contentElement),
      plugins: [createInvisiblesPlugin(invisibleType, { shouldShowInvisibles: shouldShowInvisibles })],
    }),
  });
};

const getDocDecorations = (editor: EditorView) => (editor.someProp("decorations")?.(editor.state) as DecorationSet).find()

describe("State management", () => {
  describe("Active state", () => {
    it("should set the active state initially", () => {
      const editor = createEditor([space],"<p>Example doc</p>", false);

      const pluginState = pluginKey.getState(editor.state)
      expect(pluginState?.shouldShowInvisibles).toBe(false)
    });
    it("should provide a command to set the active state of the plugin", () => {
      const editor = createEditor([space],"<p>Example doc</p>", true);
      commands.setActiveState(false)(editor.state, editor.dispatch)

      const pluginState = pluginKey.getState(editor.state)
      expect(pluginState?.shouldShowInvisibles).toBe(false)
    });
    it("should show decorations when the active state is true", () => {
      const editor = createEditor([space],"<p>Example doc with four spaces</p>", true);

      const currentDecorations = getDocDecorations(editor)
      expect(currentDecorations?.length).toBe(4)
    });
    it("should hide decorations when the active state is false", () => {
      const editor = createEditor([space],"<p>Example doc with four spaces</p>", false);

      const currentDecorations = getDocDecorations(editor)
      expect(currentDecorations?.length).toBe(0)
    });
    it("should show decorations when the active state is true, with 2 hard breaks", () => {
      const editor = createEditor([hardBreak],"<p>Example doc with four spaces </br>Some more text</br></p>", true);

      const currentDecorations = getDocDecorations(editor)
      expect(currentDecorations?.length).toBe(2)
    });
    it("should hide decorations when the active state is false, with 2 hard breaks", () => {
      const editor = createEditor([hardBreak],"<p>Example doc with four spaces </br>Some more text</br></p>", false);

      const currentDecorations = getDocDecorations(editor)
      expect(currentDecorations?.length).toBe(0)
    });
    it("should show decorations when the active state is true, with 2 paragraphs", () => {
      const editor = createEditor([paragraph],"<p>Example doc with two paragraphs</p> <p> Some more test text </p>", true);

      const currentDecorations = getDocDecorations(editor)
      expect(currentDecorations?.length).toBe(2)
    });
    it("should hide decorations when the active state is false, with 2 paragraphs", () => {
      const editor = createEditor([paragraph],"<p>Example doc with two paragraphs</p> <p> Some more test text </p>", false);

      const currentDecorations = getDocDecorations(editor)
      expect(currentDecorations?.length).toBe(0)
    });
    it("should hide decorations when the active state is true, with 2 headings", () => {
      const editor = createEditor([heading],"<p>Example <h2>Heading</h2> with another <h2>heading</h2> Some more text</p>", true);

      const currentDecorations = getDocDecorations(editor)
      expect(currentDecorations?.length).toBe(2)
    });
    it("should hide decorations when the active state is true, with 2 headings", () => {
      const editor = createEditor([heading],"<p>Example <h2>Heading</h2> with another <h2>heading</h2> Some more text</p>", false);

      const currentDecorations = getDocDecorations(editor)
      expect(currentDecorations?.length).toBe(0)
    });
    it("should hide decorations when the active state is true, with 2 nbspace", () => {
      const editor = createEditor([nbSpace],"<p>Example <h2>Heading</h2> with &nbsp; another&nbsp; space <h2>heading</h2> Some more text</p>", true);

      const currentDecorations = getDocDecorations(editor)
      expect(currentDecorations?.length).toBe(2)
    });
    it("should hide decorations when the active state is false, with 2 nbspace", () => {
      const editor = createEditor([nbSpace],"<p>Example <h2>Heading</h2> with &nbsp; another&nbsp; space <h2>heading</h2> Some more text</p>", false);

      const currentDecorations = getDocDecorations(editor)
      expect(currentDecorations?.length).toBe(0)
    });
  });
});
