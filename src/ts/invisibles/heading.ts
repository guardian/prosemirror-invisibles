import { Node } from "prosemirror-model";
import { createInvisibleDecosForNode } from "./node";

const isHeading = (node: Node): boolean => node.type === node.type.schema.nodes.heading
export default createInvisibleDecosForNode("heading", (node, pos) => pos + node.nodeSize - 1, isHeading);
