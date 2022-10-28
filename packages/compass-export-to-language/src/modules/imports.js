/**
 * The prefix.
 */
const PREFIX = 'export-to-language/imports';

/**
 * Imports changed action.
 */
export const IMPORTS_CHANGED = `${PREFIX}/IMPORTS_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to imports.
 *
 * @param {String} state - The imports state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === IMPORTS_CHANGED) {
    return action.imports;
  }

  return state;
}

/**
 * Action creator for imports changed events.
 *
 * @param {String} imports - The imports value.
 *
 * @returns {Object} The imports changed action.
 */
export const importsChanged = (imports) => ({
  type: IMPORTS_CHANGED,
  imports,
});
