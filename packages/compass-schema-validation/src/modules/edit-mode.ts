import type { RootAction } from '.';

/**
 * The edit mode changed action.
 */
export const EDIT_MODE_CHANGED =
  'validation/namespace/EDIT_MODE_CHANGED' as const;
interface EditModeChangedAction {
  type: typeof EDIT_MODE_CHANGED;
  editMode: Partial<EditModeState>;
}

export type EditModeAction = EditModeChangedAction;

export interface EditModeState {
  collectionReadOnly: boolean;
  collectionTimeSeries: boolean;
  writeStateStoreReadOnly: boolean;
  oldServerReadOnly: boolean;
}

/**
 * The initial state.
 */
export const INITIAL_STATE: EditModeState = {
  collectionReadOnly: false,
  collectionTimeSeries: false,
  writeStateStoreReadOnly: false,
  oldServerReadOnly: false,
};

/**
 * Reducer function for handle state changes to namespace.
 *
 * @param {String} state - The namespace state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(
  state: EditModeState = INITIAL_STATE,
  action: RootAction
): EditModeState {
  if (action.type === EDIT_MODE_CHANGED) {
    return { ...state, ...action.editMode };
  }

  return state;
}

/**
 * Action creator for the edit mode changed events.
 *
 * @param {Object} editMode - The edit mode.
 *
 * @returns {Object} The edit mode changed action.
 */
export const editModeChanged = (
  editMode: Partial<EditModeState>
): EditModeChangedAction => ({
  type: EDIT_MODE_CHANGED,
  editMode,
});
