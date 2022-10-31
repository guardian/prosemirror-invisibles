import { Node } from "prosemirror-model";
import { Selection } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";

export const BuilderTypes = {
  NODE: 'NODE',
  CHAR: 'CHAR'
} as const;

type BuilderTypes = keyof typeof BuilderTypes;

/**
 * Append a set of decorations for an invisible character to the given DecorationSet.
 */
type AddDecorationsForInvisible = {
  type: BuilderTypes;
  createDecorations: (
    from: number,
    to: number,
    doc: Node,
    decos: DecorationSet,
    selection?: Selection,
    displayLineEndSelection?: boolean
  ) => DecorationSet;
};

export default AddDecorationsForInvisible;
