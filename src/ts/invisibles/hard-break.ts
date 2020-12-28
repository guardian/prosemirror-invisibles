import { Node } from "prosemirror-model";
import ToInvisible from "./invisible";
import node from "./node";

const hardBreak = (
  predicate = (node: Node): boolean =>
    node.type === node.type.schema.nodes.hard_break
): ToInvisible => node("break", (_, pos) => pos)(predicate);

export default hardBreak;
