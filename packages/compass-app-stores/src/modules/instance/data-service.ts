import type { DataService } from 'mongodb-data-service';
import type { RootAction } from '.';

/**
 * Create data service.
 */
export const CHANGE_DATA_SERVICE = 'app/instance/CHANGE_DATA_SERVICE' as const;
interface ChangeDataServiceAction {
  type: typeof CHANGE_DATA_SERVICE;
  dataService: DataService | null;
}
export type DataServiceAction = ChangeDataServiceAction;
export type DataServiceState = DataService | null;

/**
 * The initial state of the data service.
 */
export const INITIAL_STATE: DataServiceState = null;

/**
 * Reducer function for handle state changes to data service.
 *
 * @param {String} state - The data service state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(
  state: DataServiceState = INITIAL_STATE,
  action: RootAction
): DataServiceState {
  if (action.type === CHANGE_DATA_SERVICE) {
    return action.dataService;
  }
  return state;
}

/**
 * The change data service action creator.
 *
 * @param {String} dataService - The dataService.
 *
 * @returns {Object} The action.
 */
export const changeDataService = (
  dataService: DataService
): ChangeDataServiceAction => ({
  type: CHANGE_DATA_SERVICE,
  dataService: dataService,
});
