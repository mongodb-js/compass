
/**
 * The edit mode changed action.
 */
export const EDIT_MODE_CHANGED = 'validation/namespace/EDIT_MODE_CHANGED';

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  collectionReadOnly: false,
  hardonReadOnly: false,
  writeStateStoreReadOnly: false,
  oldServerReadOnly: false
};

/**
 * Reducer function for handle state changes to namespace.
 *
 * @param {String} state - The namespace state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
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
export const editModeChanged = (editMode) => ({
  type: EDIT_MODE_CHANGED,
  editMode
});
