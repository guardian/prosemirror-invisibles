import { Plugin, AllSelection, EditorState } from "prosemirror-state";
import { DecorationSet, EditorView } from "prosemirror-view";
import AddDecorationsForInvisible from "./utils/invisible";
import getInsertedRanges, { Range } from "./utils/get-inserted-ranges";
import {
  commands,
  getActionFromTransaction,
  pluginKey,
  PluginState,
  reducer,
} from "./state";
import "../css/invisibles.css";

interface InvisiblesOptions {
  shouldShowInvisibles?: boolean;
  // Add styling to emulate the selection of line end characters with CSS.
  displayLineEndSelection?: boolean;
}

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
  { shouldShowInvisibles = true, displayLineEndSelection = false }: InvisiblesOptions = {}
): Plugin<PluginState> =>
  new Plugin({
    key: pluginKey,
    state: {
      init: (_, state) => {
        const { from, to } = new AllSelection(state.doc);
        const decorations = builders.reduce(
          (newDecos, { createDecorations }) =>
            createDecorations(
              from,
              to,
              state.doc,
              newDecos,
              state.selection,
              displayLineEndSelection
            ),
          DecorationSet.empty
        );

        return {
          shouldShowInvisibles: shouldShowInvisibles,
          shouldShowLineEndSelectionDecorations: true,
          decorations,
        } as PluginState;
      },
      apply: (tr, pluginState, oldState, newState) => {
        const newPluginState = reducer(
          pluginState,
          getActionFromTransaction(tr)
        );

        const documentBlurStateHasNotChanged =
          pluginState.shouldShowLineEndSelectionDecorations === newPluginState.shouldShowLineEndSelectionDecorations;
        const docAndSelectionHaveNotChanged =
          !tr.docChanged && oldState.selection === newState.selection;

        if (documentBlurStateHasNotChanged && docAndSelectionHaveNotChanged) {
          return newPluginState;
        }

        const insertedRanges = getInsertedRanges(tr);
        const selectedRanges: Range[] = [
          [tr.selection.from, tr.selection.to],
          // We must include the old selection to ensure that any decorations that
          // are no longer selected are correctly amended.
          [
            oldState.selection.from,
            // We are operating on selections based on the old document that may no
            // longer exist, so we cap the selection to the size of the document.
            Math.min(oldState.selection.to, tr.doc.nodeSize - 2),
          ],
        ];
        const allRanges = insertedRanges.concat(selectedRanges);
        const shouldDisplayLineEndDecorations =
          displayLineEndSelection && newPluginState.shouldShowLineEndSelectionDecorations;

        const decorations = builders.reduce(
          (newDecos, { createDecorations, type }) => {
            const rangesToApply = type === "NODE" ? allRanges : insertedRanges;
            return rangesToApply.reduce(
              (nextDecos, [from, to]) =>
                createDecorations(
                  from,
                  to,
                  tr.doc,
                  nextDecos,
                  tr?.selection,
                  shouldDisplayLineEndDecorations
                ),
              newDecos
            );
          },
          newPluginState.decorations.map(tr.mapping, newState.doc)
        );

        return { ...newPluginState, decorations };
      },
    },
    props: {
      decorations: function (state: EditorState) {
        const { shouldShowInvisibles, decorations } = this.getState(state) || {};
        return shouldShowInvisibles ? decorations : DecorationSet.empty;
      },
      handleDOMEvents: {
        blur: (view: EditorView, event: FocusEvent) => {
          // When we blur the editor but remain focused on the page, the DOM
          // will lose its selection but Prosemirror will not. This will cause
          // prosemirror-elements' selection emulation decorations to remain on
          // the page. We store state to manually turn off the selection
          // emulation in this case.
          const selectionFallsOutsideOfPage =
            document.activeElement === event.target;
          if (!selectionFallsOutsideOfPage) {
            commands.setFocusedState(false)(view.state, view.dispatch);
          }

          return false;
        },
        focus: (view: EditorView) => {
          commands.setFocusedState(true)(view.state, view.dispatch);

          return false;
        },
      },
    },
  });

export { createInvisiblesPlugin };

export { createInvisibleDecosForCharacter } from "./invisibles/character";
export { createInvisibleDecosForNode } from "./invisibles/node";

export { default as space } from "./invisibles/space";
export { default as hardBreak } from "./invisibles/hard-break";
export { default as paragraph } from "./invisibles/paragraph";
export { default as nbSpace } from "./invisibles/nbSpace";
export { default as heading } from "./invisibles/heading";

export { default as createDeco } from "./utils/create-deco";
export { default as textBetween } from "./utils/text-between";

export { selectActiveState } from "./state";
export { commands } from "./state";
