
/**
 * The indexes changed action.
 */
export const INDEXES_CHANGED = 'explain/indexes/INDEXES_CHANGED';

/**
 * The initial state.
 */
export const INITIAL_STATE = [];

/**
 * Reducer function to handle the state.
 *
 * @param {String} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === INDEXES_CHANGED) {
    return action.indexes;
  }

  return state;
}

/**
 * Action creator for indexes changed events.
 *
 * @param {Array} indexes - The indexes.
 *
 * @returns {Object} The indexes changed action.
 */
export const indexesChanged = (indexes) => ({
  type: INDEXES_CHANGED,
  indexes
});
