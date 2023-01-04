import {
  createInvisiblesPlugin,
  space,
  nbSpace,
  paragraph,
  hardBreak,
} from "../index";
import { doc, schema } from "prosemirror-test-builder";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

export const createEditor = (
  docNode = doc(),
  shouldShowInvisibles = true,
  displayLineEndSelection = true
): EditorView => {
  const contentElement = document.createElement("content");

  return new EditorView(contentElement, {
    state: EditorState.create({
      doc: docNode,
      schema,
      plugins: [
        createInvisiblesPlugin([hardBreak, paragraph, space, nbSpace], {
          shouldShowInvisibles: shouldShowInvisibles,
          displayLineEndSelection,
        }),
      ],
    }),
  });
};
