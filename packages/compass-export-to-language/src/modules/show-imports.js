/**
 * The prefix.
 */
const PREFIX = 'export-to-language/show-imports';

/**
 * ShowImports changed action.
 */
export const SHOW_IMPORTS_CHANGED = `${PREFIX}/SHOW_IMPORTS_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to showImports.
 *
 * @param {String} state - The showImports state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SHOW_IMPORTS_CHANGED) {
    return action.showImports;
  }

  return state;
}

/**
 * Action creator for showImports changed events.
 *
 * @param {String} showImports - The showImports value.
 *
 * @returns {Object} The showImports changed action.
 */
export const showImportsChanged = (showImports) => ({
  type: SHOW_IMPORTS_CHANGED,
  showImports,
});
