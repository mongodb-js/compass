/**
 * Change is db list expanded action name.
 */
export const TOGGLE_IS_DBLIST_EXPANDED = 'indexes/is-dblist-expanded/TOGGLE_IS_DBLIST_EXPANDED';

/**
 * The initial state of the is db list expanded attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is dblist expanded.
 *
 * @param {Boolean} state - The is db list expanded state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_DBLIST_EXPANDED) {
    return action.isDblistExpanded;
  }
  return state;
}

/**
 * The toggle is db list expanded action creator.
 *
 * @param {Boolean} isDblistExpanded - Is the db list expanded.
 *
 * @returns {Object} The action.
 */
export const toggleIsDblistExpanded = (isDblistExpanded) => ({
  type: TOGGLE_IS_DBLIST_EXPANDED,
  isDblistExpanded: isDblistExpanded
});
