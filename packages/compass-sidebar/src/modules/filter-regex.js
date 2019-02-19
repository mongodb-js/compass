/**
 * Filter regex action.
 */
export const CHANGE_FILTER_REGEX = 'sidebar/filter-regex/CHANGE_FILTER_REGEX';

/**
 * The initial state of the sidebar filter regex.
 */
export const INITIAL_STATE = /(?:)/;

/**
 * Reducer function for handle state changes to sidebar filter regex.
 *
 * @param {String} state - The sidebar filter regex state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_FILTER_REGEX) {
    return action.filterRegex;
  }
  return state;
}

/**
 * The change filterRegex action creator.
 *
 * @param {String} filterRegex - The filterRegex.
 *
 * @returns {Object} The action.
 */
export const changeFilterRegex = (filterRegex) => ({
  type: CHANGE_FILTER_REGEX,
  filterRegex: filterRegex
});
