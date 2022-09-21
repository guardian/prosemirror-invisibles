import { Plugin, AllSelection, EditorState } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
import AddDecorationsForInvisible from "utils/invisible";
import getInsertedRanges from "utils/get-inserted-ranges";
import { getActionFromTransaction, pluginKey, PluginState, reducer } from "state";


/**
 * Create a plugin to render invisible characters. Accepts a list of
 * creator functions, examples of which are defined in './invisibles'.
 *
 * Example usage: ```
 *  import hardBreak from 'invisibles/hard-break';
 *  import paragraph from 'invisibles/paragraph';
 *  const plugin = createInvisiblesPlugin([hardBreak(), paragraph()])
 * ```
 */
const createInvisiblesPlugin = (
  builders: AddDecorationsForInvisible[],
  isActive = true
): Plugin<PluginState> => {
  const addDecosBetween: AddDecorationsForInvisible = (from, to, doc, decos) =>
    builders.reduce((newDecos, fn) => fn(from, to, doc, newDecos), decos);

  return new Plugin({
    key: pluginKey,
    state: {
      init: (_, state) => {
        const { from, to } = new AllSelection(state.doc);
        return {
          isActive,
          decorations: addDecosBetween(
            from,
            to,
            state.doc,
            DecorationSet.empty
          ),
        };
      },
      apply: (tr, pluginState, _, state) => {
        const newPluginState = reducer(
          pluginState,
          getActionFromTransaction(tr)
        );
        if (!tr.docChanged) {
          return newPluginState;
        }
        const decorations = getInsertedRanges(tr).reduce(
          (nextDecos, [from, to]) =>
            addDecosBetween(from, to, state.doc, nextDecos),
          newPluginState.decorations.map(tr.mapping, tr.doc)
        );
        return { ...newPluginState, decorations };
      },
    },
    props: {
      decorations: function (state: EditorState) {
        const { isActive, decorations } = this.getState(state);
        return isActive ? decorations : DecorationSet.empty;
      },
    },
  });
};

export default createInvisiblesPlugin;

export { default as character } from "invisibles/character";
export { default as node } from "invisibles/node";

export { default as space } from "invisibles/space";
export { default as hardBreak } from "invisibles/hard-break";
export { default as paragraph } from "invisibles/paragraph";

export { default as createDeco } from "utils/create-deco";
export { default as textBetween } from "utils/text-between";

export { selectActiveState } from './state'
export { commands } from "state";
