import { Plugin, AllSelection } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
import ToInvisible from "./invisibles/invisible";
import getInsertedRanges from "./utils/get-inserted-ranges";

export default (builders: ToInvisible[]): Plugin<DecorationSet> => {
  const addDecosBetween: ToInvisible = (from: number, to: number, doc, decos) =>
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
          : prevDecos,
    },
    props: {
      decorations: function (state) {
        return this.getState(state);
      },
    },
  });
};

export { default as character } from "./invisibles/character";
export { default as node } from "./invisibles/node";

export { default as space } from "./invisibles/space";
export { default as hardBreak } from "./invisibles/hard-break";
export { default as paragraph } from "./invisibles/paragraph";

export { default as createDeco } from "./utils/create-deco";
export { default as textBetween } from "./utils/text-between";
