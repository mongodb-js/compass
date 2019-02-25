/**
 * Create active tab index.
 */
export const CHANGE_ACTIVE_TAB_INDEX = 'app/collection/CHANGE_ACTIVE_TAB_INDEX';

/**
 * The initial state of the active tab index.
 */
export const INITIAL_STATE = 0;

/**
 * Reducer function for handle state changes to active tab index.
 *
 * @param {String} state - The active tab index state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_ACTIVE_TAB_INDEX) {
    return action.activeTabIndex;
  }
  return state;
}

/**
 * The change active tab index action creator.
 *
 * @param {String} activeTabIndex - The active tab index.
 *
 * @returns {Object} The action.
 */
export const changeActiveTabIndex = (activeTabIndex) => ({
  type: CHANGE_ACTIVE_TAB_INDEX,
  activeTabIndex: activeTabIndex
});
