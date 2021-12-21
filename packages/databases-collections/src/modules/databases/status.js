// The module prefix.
const PREFIX = 'compass-databases-collections/databases-status';

/**
 * The initial state of the databases attribute.
 */
export const INITIAL_STATE = {
  status: 'initial',
  error: null,
};

export const DATABASES_STATUS_CHANGED = `${PREFIX}/DATABASES_STATUS_CHANGED`;

export const databasesStatusChanged = (instance) => ({
  type: DATABASES_STATUS_CHANGED,
  status: instance.databasesStatus,
  error: instance.databasesError,
});

/**
 * Reducer function for handle state changes to databases.
 *
 * @param {Array} state - The databases state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case DATABASES_STATUS_CHANGED:
      return {
        status: action.status,
        error: action.error,
      };
    default:
      return state;
  }
}
