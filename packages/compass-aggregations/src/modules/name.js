/**
 * Namespace changed action.
 */
export const NAME_CHANGED = 'aggregations/name/NAME_CHANGED';

/**
 * The initial state.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to name.
 *
 * @param {String} state - The name state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === NAME_CHANGED) {
    return action.name;
  }
  return state;
}

/**
 * Action creator for name changed events.
 *
 * @param {String} name - The name value.
 *
 * @returns {Object} The name changed action.
 */
export const nameChanged = (name) => ({
  type: NAME_CHANGED,
  name: name
});
