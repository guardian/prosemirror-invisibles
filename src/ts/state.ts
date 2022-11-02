import { EditorState, PluginKey, Transaction } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";

/**
 * State
 */

export interface PluginState {
  decorations: DecorationSet;
  shouldShowInvisibles: boolean;
  // Should we alter invisible decorations to emulate the selection of line end
  // characters?
  shouldShowLineEndSelectionDecorations: boolean;
}

export const pluginKey = new PluginKey<PluginState>(
  "PROSEMIRROR_INVISIBLES_PLUGIN"
);

/**
 * Selectors
 */
export const selectActiveState = (state: EditorState): boolean =>
  !!pluginKey.getState(state)?.shouldShowInvisibles;

/**
 * Actions
 */

const PROSEMIRROR_INVISIBLES_ACTION = "PM_INVISIBLES_ACTION";
export const getActionFromTransaction = (
  tr: Transaction
): Actions | undefined => tr.getMeta(PROSEMIRROR_INVISIBLES_ACTION);

const SET_SHOW_INVISIBLES_STATE = "SET_SHOW_INVISIBLES_STATE" as const;
const SET_FOCUS_STATE = "BLUR_DOCUMENT" as const;

const setShowInvisiblesStateAction = (shouldShowInvisibles: boolean) => ({
  type: SET_SHOW_INVISIBLES_STATE,
  payload: { shouldShowInvisibles },
});

const setFocusedStateAction = (isFocused: boolean) => ({
  type: SET_FOCUS_STATE,
  payload: { isFocused },
});

export type Actions =
  | ReturnType<typeof setShowInvisiblesStateAction>
  | ReturnType<typeof setFocusedStateAction>;

/**
 * Reducer
 */

export const reducer = (
  state: PluginState,
  action: Actions | undefined
): PluginState => {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case SET_SHOW_INVISIBLES_STATE:
      return { ...state, shouldShowInvisibles: action.payload.shouldShowInvisibles };
    case SET_FOCUS_STATE: {
      return {
        ...state,
        shouldShowLineEndSelectionDecorations: action.payload.isFocused,
      };
    }
    default:
      return state;
  }
};

/**
 * Commands
 */

type Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => boolean;

const toggleActiveState = (): Command => (state, dispatch) => {
  dispatch &&
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_INVISIBLES_ACTION,
        setShowInvisiblesStateAction(!pluginKey.getState(state)?.shouldShowInvisibles)
      )
    );
  return true;
};

const setActiveState = (shouldShowInvisibles: boolean): Command => (state, dispatch) => {
  dispatch &&
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_INVISIBLES_ACTION,
        setShowInvisiblesStateAction(shouldShowInvisibles)
      )
    );
  return true;
};

const setFocusedState = (isFocused: boolean): Command => (state, dispatch) => {
  dispatch &&
    dispatch(
      state.tr.setMeta(
        PROSEMIRROR_INVISIBLES_ACTION,
        setFocusedStateAction(isFocused)
      )
    );
  return true;
};

export const commands = { setActiveState, toggleActiveState, setFocusedState };
