/**
 * The initial state of the columns attribute.
 */
export const INITIAL_STATE = [ 'Database Name', 'Storage Size', 'Collections', 'Indexes' ];

/**
 * Reducer function for handle state changes to columns.
 *
 * @param {Array} state - The columns state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE) {
  return state;
}
