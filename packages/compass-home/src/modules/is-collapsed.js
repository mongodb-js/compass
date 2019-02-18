/**
 * The module action prefix.
 */
const PREFIX = 'home';

/**
 * The isCollapsed action type.
 */
export const TOGGLE_IS_COLLAPSED = `${PREFIX}/is-collapsed/TOGGLE_IS_COLLAPSED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to isCollapsed.
 *
 * @param {Boolean} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === TOGGLE_IS_COLLAPSED) {
    return action.isCollapsed;
  }
  return state;
};

export default reducer;

/**
 * Action creator for isCollapsed events.
 *
 * @param {Boolean} isCollapsed
 * @returns {Object} The isCollapsed action.
 */
export const toggleIsCollapsed = (isCollapsed) => ({
  type: TOGGLE_IS_COLLAPSED,
  isCollapsed: isCollapsed
});
