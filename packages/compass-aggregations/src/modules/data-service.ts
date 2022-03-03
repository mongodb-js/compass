import type { DataService } from "mongodb-data-service";
import type { AnyAction } from "redux";

/**
 * The prefix.
 */
const PREFIX = 'aggregations/data-service';

/**
 * Data service connected.
 */
export const DATA_SERVICE_CONNECTED = `${PREFIX}/DATA_SERVICE_CONNECTED`;

type State = {
  error: Error | null;
  dataService: DataService | null;
}

/**
 * The initial state.
 */
export const INITIAL_STATE: State = {
  error: null,
  dataService: null,
};

/**
 * Reducer function for handling data service connected actions.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction): State {
  if (action.type === DATA_SERVICE_CONNECTED) {
    return {
      error: action.error,
      dataService: action.dataService
    };
  }
  return state;
}

/**
 * Action creator for data service connected events.
 *
 */
export const dataServiceConnected = (error: Error, dataService: DataService): AnyAction => ({
  type: DATA_SERVICE_CONNECTED,
  error: error,
  dataService: dataService
});
