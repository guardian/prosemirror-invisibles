import { Node } from "prosemirror-model";
import { createInvisibleDecosForNode } from "./node";

const isParagraph = (node: Node): boolean => node.type === node.type.schema.nodes.paragraph
export default createInvisibleDecosForNode("par", (node, pos) => pos + node.nodeSize - 1, isParagraph);
