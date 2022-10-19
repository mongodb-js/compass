import preferences from 'compass-preferences-model';

/**
 * The initial state of the is readonly attribute.
 */
export const INITIAL_STATE = preferences.getPreferences().readOnly;

/**
 * Reducer function doesn't do anything since we're based on process.
 */
export default function reducer(state = INITIAL_STATE) {
  return state;
}
