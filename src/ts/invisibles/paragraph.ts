import { Node } from "prosemirror-model";
import AddDecorationsForInvisible from "../utils/invisible";
import node from "./node";

export default (
  predicate = (node: Node): boolean =>
    node.type === node.type.schema.nodes.paragraph
): AddDecorationsForInvisible =>
  node("par", (node, pos) => pos + node.nodeSize - 1)(predicate);
