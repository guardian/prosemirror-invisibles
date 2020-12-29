import { Node } from "prosemirror-model";
import { DecorationSet } from "prosemirror-view";

/**
 * Append a set of decorations for an invisible character to the given DecorationSet.
 */
type AddDecorationsForInvisible = (
  from: number,
  to: number,
  doc: Node,
  decos: DecorationSet
) => DecorationSet;

export default AddDecorationsForInvisible;
