// The module prefix.
const PREFIX = 'compass-databases-collections/collections-status';

/**
 * The initial state of the collections attribute.
 */
export const INITIAL_STATE = {
  status: 'initial',
  error: null,
};

export const COLLECTIONS_STATUS_CHANGED = `${PREFIX}/COLLECTIONS_STATUS_CHANGED`;

export const collectionsStatusChanged = (db) => ({
  type: COLLECTIONS_STATUS_CHANGED,
  status: db.collectionsStatus,
  error: db.collectionsError,
});

/**
 * Reducer function for handle state changes to collections.
 *
 * @param {Array} state - The collections state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case COLLECTIONS_STATUS_CHANGED:
      return {
        status: action.status,
        error: action.error,
      };
    default:
      return state;
  }
}
