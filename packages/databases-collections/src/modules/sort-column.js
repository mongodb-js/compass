import { UPDATE_SORT } from './sort';

/**
 * The initial state of the sort column attribute.
 */
export const INITIAL_STATE = 'Collection Name';

/**
 * Reducer function for handle state changes to sort column.
 *
 * @param {Array} state - The sort column state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === UPDATE_SORT) {
    return action.column;
  }
  return state;
}
