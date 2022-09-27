import { Node } from "prosemirror-model";
import { createInvisibleDecosForNode } from "./node";

const isHardbreak = (node: Node): boolean => node.type === node.type.schema.nodes.hard_break
export default createInvisibleDecosForNode("break", (_, pos) => pos, isHardbreak);
