import { Node } from "prosemirror-model";
import AddDecorationsForInvisible from "../utils/invisible";
import node from "./node";

const hardBreak = (
  predicate = (node: Node): boolean =>
    node.type === node.type.schema.nodes.hard_break
): AddDecorationsForInvisible => node("break", (_, pos) => pos)(predicate);

export default hardBreak;
