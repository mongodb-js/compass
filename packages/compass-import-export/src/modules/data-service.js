/**
 * Action for the dataService connection.
 */
const DATA_SERVICE_CONNECTED = 'import-export/ns/DATA_SERVICE_CONNECTED';

/**
 * The initial dataService state.
 */
const INITIAL_STATE = {};

/**
 * Create a ns changed action.
 *
 * @param {Object} error - dataService connection error
 *
 * @param {DataService} dataService - data service instance.
 *
 * @returns {Object} The action.
 */
const dataServiceConnected = (error, dataService) => {
  return {
    type: DATA_SERVICE_CONNECTED,
    error,
    dataService
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
    return action.dataService;
  }
  return state;
};

export default reducer;
export {
  dataServiceConnected,
  DATA_SERVICE_CONNECTED
};
