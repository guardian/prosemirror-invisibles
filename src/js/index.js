import { Plugin, AllSelection } from 'prosemirror-state';
import { DecorationSet } from 'prosemirror-view';
import getInsertedRanges from './utils/get-inserted-ranges';

export default builders => {
  const addDecosBetween = (from, to, doc, decos) =>
    builders.reduce((newDecos, fn) => fn(from, to, doc, newDecos), decos);

  return new Plugin({
    state: {
      init: (_, state) => {
        const { from, to } = new AllSelection(state.doc);
        return addDecosBetween(from, to, state.doc, DecorationSet.empty);
      },
      apply: (tr, prevDecos, _, state) =>
        tr.docChanged
          ? getInsertedRanges(tr).reduce(
              (nextDecos, [from, to]) =>
                addDecosBetween(from, to, state.doc, nextDecos),
              prevDecos.map(tr.mapping, tr.doc)
            )
          : prevDecos
    },
    props: {
      decorations: function(state) {
        return this.getState(state);
      }
    }
  });
};

export { default as space } from './decorations/space';
export { default as hardBreak } from './decorations/hard-break';
export { default as paragraph } from './decorations/paragraph';
