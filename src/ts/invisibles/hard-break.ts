import { Node } from "prosemirror-model";
import ToInvisible from "./invisible";
import node from "./node";

const hardBreak = (
  predicate = (node: Node) => node.type === node.type.schema.nodes.hard_break
) => node("break", (_, pos) => pos)(predicate);

export default hardBreak;
