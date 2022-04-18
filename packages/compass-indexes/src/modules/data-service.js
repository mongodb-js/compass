/**
 * The prefix.
 */
const PREFIX = 'indexes/data-service';

/**
 * Data service connected.
 */
export const DATA_SERVICE_CONNECTED = `${PREFIX}/DATA_SERVICE_CONNECTED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = null;

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
    return action.dataService;
  }
  return state;
}

/**
 * Action creator for data service connected events.
 *
 * @param {DataService} dataService - The data service.
 *
 * @returns {Object} The data service connected action.
 */
export const dataServiceConnected = (dataService) => ({
  type: DATA_SERVICE_CONNECTED,
  dataService: dataService,
});
