import { SORT_INDEXES, ASC } from './indexes';

/**
 * The initial state of the sort order attribute.
 */
export const INITIAL_STATE = ASC;

/**
 * Reducer function for handle state changes to sortOrder.
 *
 * @param {Boolean} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === SORT_INDEXES) {
    return action.order;
  }
  return state;
};

export default reducer;
