import {
  createInvisiblesPlugin,
  space,
  nbSpace,
  paragraph,
  hardBreak,
} from "index";
import { addListNodes } from "prosemirror-schema-list";
import { DOMParser, Schema } from "prosemirror-model";
import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

const testSchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
  marks: schema.spec.marks,
});

export const createEditor = (htmlDoc = "", isActive?: boolean): EditorView => {
  const contentElement = document.createElement("content");
  contentElement.innerHTML = htmlDoc;
  return new EditorView(contentElement, {
    state: EditorState.create({
      doc: DOMParser.fromSchema(testSchema).parse(contentElement),
      plugins: [
        createInvisiblesPlugin(
          [hardBreak, paragraph, space, nbSpace],
          isActive
        ),
      ],
    }),
  });
};
