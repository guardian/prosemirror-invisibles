import { Node } from 'prosemirror-model';
import { DecorationSet } from 'prosemirror-view';

type ToInvisible = (
  from: number,
  to: number,
  doc: Node,
  decos: DecorationSet
) => DecorationSet;

export default ToInvisible;
