import { Node } from "prosemirror-model";
import createDeco from "utils/create-deco";
import AddDecorationsForInvisible from "../utils/invisible";

export const createInvisibleDecosForNode = (
  type: string,
  toPosition: (node: Node, pos: number) => number,
  predicate: (node: Node) => boolean
): AddDecorationsForInvisible => (
  from,
  to,
  doc,
  decos
) => {
  let newDecos = decos;
  doc.nodesBetween(from, to, (node, pos) => {
    if (predicate(node)) {
      const decoPos = toPosition(node, pos);
      const oldDecos = newDecos.find(
        decoPos,
        decoPos,
        (spec) => spec.key === type
      );
      newDecos = newDecos
        .remove(oldDecos)
        .add(doc, [createDeco(decoPos, type)]);
    }
  });
  return newDecos;
};
