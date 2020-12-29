import { EditorState, Transaction } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";

/**
 * State
 */

export interface PluginState {
  decorations: DecorationSet;
  isActive: boolean;
}

/**
 * Actions
 */

const PROSEMIRROR_INVISIBLES_ACTION = "PM_INVISIBLES_ACTION";
export const getActionFromTransaction = (tr: Transaction): Actions | undefined => tr.getMeta(PROSEMIRROR_INVISIBLES_ACTION)

const SET_ACTIVE_STATE = "SET_ACTIVE_STATE";

export const setActiveStateActions = (isActive: boolean) => ({
  type: SET_ACTIVE_STATE,
  payload: { isActive },
});

export type Actions = ReturnType<typeof setActiveStateActions>;

/**
 * Reducer
 */

export const reducer = (state: PluginState, action: Actions | undefined): PluginState => {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case SET_ACTIVE_STATE:
      return { ...state, isActive: action.payload.isActive }
    default:
      return state;
  }
}

/**
 * Commands
 */

type Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void
) => boolean;

export const setActiveStateCommand = (isActive: boolean): Command => (
  state,
  dispatch
) => {
  dispatch &&
    dispatch(state.tr.setMeta(PROSEMIRROR_INVISIBLES_ACTION, isActive));
  return true;
};
