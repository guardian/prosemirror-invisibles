import { Node } from "prosemirror-model";
import createDeco from "utils/create-deco";
import AddDecorationsForInvisible from "../utils/invisible";

export const createInvisibleDecosForNode = (
  type: string,
  toPosition: (node: Node, pos: number) => number,
  predicate: (node: Node) => boolean,
  rendersAtLineEnd = true
): AddDecorationsForInvisible => ({
  shouldRespondToSelectionChange: true,
  createDecorations: (from, to, doc, decos, selection) => {
    let newDecos = decos;
    doc.nodesBetween(from, to, (node, pos) => {
      if (predicate(node)) {
        const decoPos = toPosition(node, pos);
        const oldDecos = newDecos.find(
          pos,
          pos + node.nodeSize,
          (deco) => deco.type === type
        );

        // When we render invisibles that appear at the end of lines, we want them
        // to be included in text selections. We can enable this by adding content
        // to the decoration that gives it the appropriate width in the DOM.
        //
        // Adding content introduces all sorts of odd behaviour under normal
        // circumstances, including problems with clicking and dragging selections
        // and flickering cursors as Prosemirror reconciles contenteditable and
        // DOM positions, so when there isn't a selection, we don't add that
        // content.
        const selectionIsCollapsed = selection?.from === selection?.to;
        const isWithinCurrentSelection =
          selection && decoPos >= selection.from && decoPos <= selection.to;
        const selectionIsLongerThanNode =
          isWithinCurrentSelection && selection.to > pos + node.nodeSize;
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
