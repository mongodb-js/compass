/**
 * The prefix.
 */
const PREFIX = 'export-to-language/builders';

/**
 * Builders changed action.
 */
export const BUILDERS_CHANGED = `${PREFIX}/BUILDERS_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = true;

/**
 * Reducer function for handle state changes to builders.
 *
 * @param {String} state - The builders state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === BUILDERS_CHANGED) {
    return action.builders;
  }

  return state;
}

/**
 * Action creator for builders changed events.
 *
 * @param {String} builders - The builders value.
 *
 * @returns {Object} The builders changed action.
 */
export const buildersChanged = (builders) => ({
  type: BUILDERS_CHANGED,
  builders,
});
