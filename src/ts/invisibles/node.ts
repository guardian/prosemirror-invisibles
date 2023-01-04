import { Node } from "prosemirror-model";
import createDeco from "../utils/create-deco";
import AddDecorationsForInvisible, { BuilderTypes } from "../utils/invisible";

export const createInvisibleDecosForNode = (
  type: string,
  toPosition: (node: Node, pos: number) => number,
  predicate: (node: Node) => boolean,
): AddDecorationsForInvisible => ({
  type: BuilderTypes.NODE,
  createDecorations: (from, to, doc, decos, selection, shouldMarkAsSelected) => {
    let newDecos = decos;

    doc.nodesBetween(from, to, (node, pos) => {
      if (predicate(node)) {
        const decoPos = toPosition(node, pos);
        const oldDecos = newDecos.find(
          pos,
          pos + node.nodeSize - 1,
          (deco) => deco.type === type
        );

        // When we render invisibles that appear at the end of lines, mark
        // them as selected where appropriate.
        const selectionIsCollapsed = selection?.from === selection?.to;
        const isWithinCurrentSelection =
          selection && decoPos >= selection.from && decoPos <= selection.to;
        const selectionIsLongerThanNode =
          !!isWithinCurrentSelection && selection.to >= pos + node.nodeSize;
        const markAsSelected =
          shouldMarkAsSelected &&
          selectionIsLongerThanNode &&
          !selectionIsCollapsed;

        newDecos = newDecos
          .remove(oldDecos)
          .add(doc, [createDeco(decoPos, type, markAsSelected)]);

        return false;
      }
    });
    return newDecos;
  },
});
