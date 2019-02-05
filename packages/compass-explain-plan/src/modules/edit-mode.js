
/**
 * Edit mode changed action.
 */
export const EDIT_MODE_CHANGED = 'validation/namespace/EDIT_MODE_CHANGED';

/**
 * The initial state.
 */
export const INITIAL_STATE = true;

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
    return action.isEditable;
  }

  return state;
}

/**
 * Action creator for edit mode changed events.
 *
 * @param {Boolean} isEditable - Is editable.
 *
 * @returns {Object} The edit mode changed action.
 */
export const editModeChanged = (isEditable) => ({
  type: EDIT_MODE_CHANGED,
  isEditable
});
