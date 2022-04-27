/**
 * The prefix.
 */
const PREFIX = 'aggregations/data-service';

/**
 * Data service connected.
 */
export const DATA_SERVICE_CONNECTED = `${PREFIX}/DATA_SERVICE_CONNECTED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  error: null,
  dataService: null,
  configuredKMSProviders: [],
  currentTopologyType: 'Unknown'
};

/**
 * Reducer function for handling data service connected actions.
 *
 * @param {Object} state - The data service state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === DATA_SERVICE_CONNECTED) {
    return {
      error: action.error,
      dataService: action.dataService,
      configuredKMSProviders: action.dataService.configuredKMSProviders ? action.dataService.configuredKMSProviders() : [],
      currentTopologyType: action.dataService.currentTopologyType ? action.dataService.currentTopologyType() : 'Unknown'
    };
  }
  return state;
}

/**
 * Action creator for data service connected events.
 *
 * @param {Error} error - The connection error.
 * @param {DataService} dataService - The data service.
 *
 * @returns {Object} The data service connected action.
 */
export const dataServiceConnected = (error, dataService) => ({
  type: DATA_SERVICE_CONNECTED,
  error: error,
  dataService: dataService
});
