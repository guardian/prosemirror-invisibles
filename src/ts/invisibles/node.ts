import { Node } from "prosemirror-model";
import createDeco from "utils/create-deco";
import AddDecorationsForInvisible, { BuilderTypes } from "../utils/invisible";

export const createInvisibleDecosForNode = (
  type: string,
  toPosition: (node: Node, pos: number) => number,
  predicate: (node: Node) => boolean,
  rendersAtLineEnd = true
): AddDecorationsForInvisible => ({
  type: BuilderTypes.NODE,
  createDecorations: (from, to, doc, decos, selection) => {
    let newDecos = decos;
    doc.nodesBetween(from, to, (node, pos) => {
      if (predicate(node)) {
        const decoPos = toPosition(node, pos);
        const oldDecos = newDecos.find(
          pos,
          pos + node.nodeSize - 1,
          (deco) => deco.type === type
        );

        // When we render invisibles that appear at the end of lines, we want
        // them to appear to be included in text selections. We can enable this
        // by adding content to the decoration that gives it the appropriate
        // width in the DOM.
        //
        // Adding content introduces all sorts of odd behaviour under normal
        // circumstances, including problems with clicking and dragging
        // selections and flickering cursors as Prosemirror reconciles
        // contenteditable and DOM positions, so when there isn't a selection,
        // or the selection doesn't cover the invisible, we don't add content.
        const selectionIsCollapsed = selection?.from === selection?.to;
        const isWithinCurrentSelection =
          selection && decoPos >= selection.from && decoPos <= selection.to;
        const selectionIsLongerThanNode =
          isWithinCurrentSelection && selection.to >= pos + node.nodeSize;
        const shouldAddContent =
          rendersAtLineEnd &&
          selectionIsLongerThanNode &&
          !selectionIsCollapsed;

        const content = shouldAddContent ? "&ensp;" : "";

        newDecos = newDecos
          .remove(oldDecos)
          .add(doc, [createDeco(decoPos, type, content)]);
      }
    });
    return newDecos;
  },
});
