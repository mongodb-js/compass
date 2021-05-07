/**
 * Action for the dataService connection.
 */
export const DATA_SERVICE_CONNECTED = 'import-export/ns/DATA_SERVICE_CONNECTED';

/**
 * The initial dataService state.
 */
const INITIAL_STATE = null;

/**
 * Create a ns changed action.
 *
 * @param {Object} error - dataService connection error
 *
 * @param {DataService} dataService - data service instance.
 *
 * @returns {Object} The action.
 */
export const dataServiceConnected = (error, dataService) => {
  return {
    type: DATA_SERVICE_CONNECTED,
    error: error,
    dataService: dataService
  };
};

/**
 * Handle ns changes on the state.
 *
 * @param {String} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {String} The state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === DATA_SERVICE_CONNECTED) {
    return {
      error: action.error,
      dataService: action.dataService
    };
  }
  return state;
};

export default reducer;
