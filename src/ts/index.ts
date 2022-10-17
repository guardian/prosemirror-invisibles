import {
  Plugin,
  AllSelection,
  EditorState,
  Transaction,
} from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";
import AddDecorationsForInvisible, { BuilderTypes } from "utils/invisible";
import getInsertedRanges from "utils/get-inserted-ranges";
import {
  getActionFromTransaction,
  pluginKey,
  PluginState,
  reducer,
} from "state";
import { Node } from "prosemirror-model";

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
  const addDecosBetween = (
    from: number,
    to: number,
    doc: Node,
    decos: DecorationSet,
    tr?: Transaction
  ) =>
    builders
      .filter(
        (builder) =>
          !tr || (tr.docChanged || builder.type === BuilderTypes.NODE)
      )
      .reduce(
        (newDecos, { createDecorations }) =>
          createDecorations(from, to, doc, newDecos, tr?.selection),
        decos
      );

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
      apply: (tr, pluginState, oldState, newState) => {
        const newPluginState = reducer(
          pluginState,
          getActionFromTransaction(tr)
        );

        if (!tr.docChanged && oldState.selection === newState.selection) {
          return newPluginState;
        }

        const decorations = getInsertedRanges(tr, oldState).reduce(
          (nextDecos, [from, to]) =>
            addDecosBetween(from, to, newState.doc, nextDecos, tr),
          newPluginState.decorations.map(tr.mapping, newState.doc)
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

export { createInvisiblesPlugin };

export { createInvisibleDecosForCharacter } from "invisibles/character";
export { createInvisibleDecosForNode } from "invisibles/node";

export { default as space } from "invisibles/space";
export { default as hardBreak } from "invisibles/hard-break";
export { default as paragraph } from "invisibles/paragraph";
export { default as nbSpace } from "invisibles/nbSpace";

export { default as createDeco } from "utils/create-deco";
export { default as textBetween } from "utils/text-between";

export { selectActiveState } from "./state";
export { commands } from "state";
