import type { DataService } from 'mongodb-data-service';
import type { AnyAction } from 'redux';

/**
 * Action for the dataService connection.
 */
export const DATA_SERVICE_CONNECTED = 'import-export/ns/DATA_SERVICE_CONNECTED';

type State = {
  dataService?: DataService;
  error?: Error;
};

/**
 * The initial dataService state.
 */
const INITIAL_STATE: State = {};

/**
 * Create a ns changed action.
 *
 * @param {Object} error - dataService connection error
 *
 * @param {DataService} dataService - data service instance.
 *
 * @returns {Object} The action.
 */
export const dataServiceConnected = (
  error: Error | undefined,
  dataService: DataService
) => {
  return {
    type: DATA_SERVICE_CONNECTED,
    error: error,
    dataService: dataService,
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
const reducer = (state: State = INITIAL_STATE, action: AnyAction): State => {
  if (action.type === DATA_SERVICE_CONNECTED) {
    return {
      error: action.error,
      dataService: action.dataService,
    };
  }
  return state;
};

export default reducer;
