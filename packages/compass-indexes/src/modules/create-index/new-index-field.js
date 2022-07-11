/**
 * Create a new index field in memory.
 */
export const CREATE_NEW_INDEX_FIELD =
  'indexes/create-index/name/CREATE_NEW_INDEX_FIELD';

/**
 * Clear a new index field in memory.
 */
export const CLEAR_NEW_INDEX_FIELD =
  'indexes/create-index/name/CLEAR_NEW_INDEX_FIELD';

/**
 * The initial state of the new index field.
 */
export const INITIAL_STATE = null;

/**
 * Reducer function for handle state changes.
 *
 * @param {String} state - The new index field state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CREATE_NEW_INDEX_FIELD) {
    return action.newField;
  }
  if (action.type === CLEAR_NEW_INDEX_FIELD) {
    return null;
  }
  return state;
}

/**
 * The create new index field action creator.
 *
 * @param {String} newField - The new index field.
 *
 * @returns {Object} The action.
 */
export const createNewIndexField = (newField) => ({
  type: CREATE_NEW_INDEX_FIELD,
  newField: newField,
});

/**
 * The clear new index field action creator.
 *
 * @returns {Object} The action.
 */
export const clearNewIndexField = () => ({
  type: CLEAR_NEW_INDEX_FIELD,
});
