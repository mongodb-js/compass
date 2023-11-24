import type { DataService } from 'mongodb-data-service';
import type { RootAction } from '.';

/**
 * The prefix.
 */
const PREFIX = 'validation/data-service';

/**
 * Data service connected.
 */
export const DATA_SERVICE_CONNECTED =
  `${PREFIX}/DATA_SERVICE_CONNECTED` as const;
interface DataServiceConnectedAction {
  type: typeof DATA_SERVICE_CONNECTED;
  dataService: DataService;
}

export type DataServiceState = DataService | null;
export type DataServiceAction = DataServiceConnectedAction;

/**
 * The initial state.
 */
export const INITIAL_STATE: DataServiceState = null;

/**
 * Reducer function for handling data service connected actions.
 */
export default function reducer(
  state: DataServiceState = INITIAL_STATE,
  action: RootAction
): DataServiceState {
  if (action.type === DATA_SERVICE_CONNECTED) {
    return action.dataService;
  }

  return state;
}

/**
 * Action creator for data service connected events.
 */
export const dataServiceConnected = (
  dataService: DataService
): DataServiceConnectedAction => ({
  type: DATA_SERVICE_CONNECTED,
  dataService,
});
