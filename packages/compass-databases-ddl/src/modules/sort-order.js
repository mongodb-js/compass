import { SORT_DATABASES } from 'modules/databases';

/**
 * The initial state of the sort order attribute.
 */
export const INITIAL_STATE = 'asc';

/**
 * Reducer function for handle state changes to sort order.
 *
 * @param {Array} state - The sort order state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SORT_DATABASES) {
    return action.order;
  }
  return state;
}
