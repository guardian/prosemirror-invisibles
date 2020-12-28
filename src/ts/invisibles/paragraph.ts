import { Node } from "prosemirror-model";
import ToInvisible from "./invisible";
import node from "./node";

export default (
  predicate = (node: Node): boolean =>
    node.type === node.type.schema.nodes.paragraph
): ToInvisible =>
  node("par", (node, pos) => pos + node.nodeSize - 1)(predicate);
