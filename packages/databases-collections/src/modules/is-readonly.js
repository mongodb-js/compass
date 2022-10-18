import preferences from 'compass-preferences-model';
const { readOnly: preferencesReadOnly } = preferences.getPreferences();

/**
 * The initial state of the is readonly attribute.
 */
export const INITIAL_STATE = preferencesReadOnly;

/**
 * Reducer function doesn't do anything since we're based on process.
 *
 * @param {Array} state - The state.
 *
 * @returns {Array} The state.
 */
export default function reducer(state = INITIAL_STATE) {
  return state;
}
