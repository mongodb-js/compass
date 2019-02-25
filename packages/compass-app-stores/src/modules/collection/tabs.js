/**
 * Create tabs.
 */
export const CHANGE_TABS = 'app/collection/CHANGE_TABS';

/**
 * The initial state of the tabs.
 */
export const INITIAL_STATE = [];

/**
 * Reducer function for handle state changes to tabs.
 *
 * @param {String} state - The tabs state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_TABS) {
    return action.tabs;
  }
  return state;
}

/**
 * The change tabs action creator.
 *
 * @param {String} tabs - The tabs.
 *
 * @returns {Object} The action.
 */
export const changeTabs = (tabs) => ({
  type: CHANGE_TABS,
  tabs: tabs
});
