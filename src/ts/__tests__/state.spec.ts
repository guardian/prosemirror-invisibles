import { createInvisiblesPlugin } from "../";
import space from "../invisibles/space";
import { addListNodes } from "prosemirror-schema-list";
import { schema } from "prosemirror-schema-basic";
import { Schema, DOMParser } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { DecorationSet, EditorView } from "prosemirror-view";
import hardBreak from "../invisibles/hard-break";
import paragraph from "../invisibles/paragraph";
import nbSpace from "../invisibles/nbSpace";
import heading from "../invisibles/heading";
import { commands, pluginKey } from "../state";
import AddDecorationsForInvisible from "../utils/invisible";

const testSchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
  marks: schema.spec.marks,
});

const createEditor = (
  invisibleType: AddDecorationsForInvisible[],
  htmlDoc: string,
  shouldShowInvisibles: boolean,
) => {
  const contentElement = document.createElement("content");
  contentElement.innerHTML = htmlDoc;
  return new EditorView(contentElement, {
    state: EditorState.create({
      doc: DOMParser.fromSchema(testSchema).parse(contentElement),
      plugins: [
        createInvisiblesPlugin(invisibleType, {
          shouldShowInvisibles: shouldShowInvisibles,
        }),
      ],
    }),
  });
};

const getDocDecorations = (editor: EditorView) =>
  (editor.someProp("decorations")?.(editor.state) as DecorationSet).find();

describe("State management", () => {

  it("should set the active state initially", () => {
    const editor = createEditor([space], "<p>Example doc</p>", false);

    const pluginState = pluginKey.getState(editor.state);
    expect(pluginState?.shouldShowInvisibles).toBe(false);
  });

  it("should provide a command to set the active state of the plugin", () => {
    const editor = createEditor([space], "<p>Example doc</p>", true);
    commands.setActiveState(false)(editor.state, editor.dispatch);

    const pluginState = pluginKey.getState(editor.state);
    expect(pluginState?.shouldShowInvisibles).toBe(false);
  });

  const invisiblesAndDocs = [
    { description: "2 hard breaks", invisibles: [hardBreak], docStr: "<p>Example doc with four spaces </br>Some more text</br></p>", count: 2 },
    { description: "2 paragraphs", invisibles: [paragraph], docStr: "<p>Example doc with two paragraphs</p> <p> Some more test text </p>", count: 2 },
    { description: "2 headings", invisibles: [heading], docStr: "<p>Example <h2>Heading</h2> with another <h2>heading</h2> Some more text</p>", count: 2 },
    { description: "2 non-breaking spaces", invisibles: [nbSpace], docStr: "<p>Example <h2>Heading</h2> with &nbsp; another&nbsp; space <h2>heading</h2> Some more text</p>", count: 2 },
  ];

  invisiblesAndDocs.forEach(({ description, invisibles, docStr, count }) => {
    it(`should hide decorations when the active state is false: ${description} `, () => {
      const editor = createEditor(
        invisibles,
        docStr,
        false,
      );

      const currentDecorations = getDocDecorations(editor);
      expect(currentDecorations?.length).toBe(0);

      const stateDecorations = pluginKey.getState(editor.state);
      expect(stateDecorations?.length).toBe(0);
    });

    it(`should show decorations when the active state is true: ${description} `, () => {
      const editor = createEditor(
        invisibles,
        docStr,
        true,
      );

      const currentDecorations = getDocDecorations(editor);
      expect(currentDecorations?.length).toBe(count);

      const stateDecorations = pluginKey.getState(editor.state);
      expect(stateDecorations?.length).toBe(count);
    });
  })
});
