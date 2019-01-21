/**
 * The initial state of the columns attribute.
 */
export const INITIAL_STATE = [
  'Collection Name',
  'Documents',
  'Avg. Document Size',
  'Total Document Size',
  'Num. Indexes',
  'Total Index Size',
  'Properties',
  '_id',
  'readonly',
  'capped'
];

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
