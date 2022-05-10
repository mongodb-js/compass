import { SORT_INDEXES } from './indexes';

/**
 * The initial state of the sort column attribute.
 */
export const INITIAL_STATE = 'Name and Definition';

/**
 * Reducer function for handle state changes to sortColumn.
 *
 * @param {Boolean} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === SORT_INDEXES) {
    return action.column;
  }
  return state;
};

export default reducer;
