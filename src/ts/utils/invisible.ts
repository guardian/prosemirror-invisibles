import { Node } from "prosemirror-model";
import { Selection } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";

/**
 * Append a set of decorations for an invisible character to the given DecorationSet.
 */
type AddDecorationsForInvisible = {
  shouldRespondToSelectionChange: boolean;
  createDecorations: (
    from: number,
    to: number,
    doc: Node,
    decos: DecorationSet,
    selection?: Selection
  ) => DecorationSet;
};

export default AddDecorationsForInvisible;
