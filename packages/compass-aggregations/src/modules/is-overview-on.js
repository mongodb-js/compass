/**
 * Toggle overview action.
 */
export const TOGGLE_OVERVIEW = 'aggregations/is-overview-on/TOGGLE_OVERVIEW';

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * This reducer only returns the initial state when combineReducers is
 * called - otherwise the root reducer will handle the TOGGLE_OVERVIEW
 * actions.
 *
 * @param {Boolean} state - The overview state.
 *
 * @returns {Boolean} The state.
 */
export default function reducer(state = INITIAL_STATE) {
  return state;
}

/**
 * Action creator for toggle overview events.
 *
 * @returns {Object} The toggle overview action.
 */
export const toggleOverview = () => ({
  type: TOGGLE_OVERVIEW
});
