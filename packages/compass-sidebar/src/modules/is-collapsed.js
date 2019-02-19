/**
 * Change is collapsed action name.
 */
export const TOGGLE_IS_COLLAPSED = 'indexes/is-collapsed/TOGGLE_IS_COLLAPSED';

/**
 * The initial state of the is collapsed attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is collapsed.
 *
 * @param {Boolean} state - The is collapsed state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_COLLAPSED) {
    return action.isCollapsed;
  }
  return state;
}

/**
 * The toggle is collapsed action creator.
 *
 * @param {Boolean} isCollapsed - Is the db list expanded.
 *
 * @returns {Object} The action.
 */
export const toggleIsCollapsed = (isCollapsed) => ({
  type: TOGGLE_IS_COLLAPSED,
  isCollapsed: isCollapsed
});
