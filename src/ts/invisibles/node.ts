import { Node } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";
import createDeco from "../utils/create-deco";
import ToInvisible from "./invisible";

export default (
  type: string,
  toPosition: (node: Node, pos: number) => number
) => (predicate: (node: Node) => boolean): ToInvisible => (
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
