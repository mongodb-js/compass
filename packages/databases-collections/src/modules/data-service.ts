import type { AnyAction } from 'redux';
import type { DataService } from 'mongodb-data-service';
import type { TopologyType } from 'mongodb';

/**
 * The prefix.
 */
const PREFIX = 'aggregations/data-service';

/**
 * Data service connected.
 */
export const DATA_SERVICE_CONNECTED = `${PREFIX}/DATA_SERVICE_CONNECTED`;

/**
 * Data service updated.
 */
export const DATA_SERVICE_UPDATED = `${PREFIX}/DATA_SERVICE_UPDATED`;

type State = {
  error: null | Error;
  dataService: DataService | null;
  configuredKMSProviders: string[];
  currentTopologyType: TopologyType
};

export const INITIAL_STATE: State = {
  error: null,
  dataService: null,
  configuredKMSProviders: [],
  currentTopologyType: 'Unknown'
};

/**
 * Reducer function for handling data service connected actions.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction): State {
  if (action.type === DATA_SERVICE_CONNECTED) {
    return {
      error: action.error,
      dataService: action.dataService,
      configuredKMSProviders: action.dataService.configuredKMSProviders ? action.dataService.configuredKMSProviders() : [],
      currentTopologyType: action.dataService.currentTopologyType ? action.dataService.currentTopologyType() : 'Unknown'
    };
  }
  if (action.type === DATA_SERVICE_UPDATED && action.dataService === state.dataService) {
    return {
      error: state.error,
      dataService: action.dataService,
      configuredKMSProviders: action.dataService.configuredKMSProviders ? action.dataService.configuredKMSProviders() : [],
      currentTopologyType: action.dataService.currentTopologyType ? action.dataService.currentTopologyType() : 'Unknown'
    };
  }
  return state;
}

/**
 * Action creator for data service connected events.
 */
export const dataServiceConnected = (error: Error | null, dataService: DataService) => ({
  type: DATA_SERVICE_CONNECTED,
  error: error,
  dataService: dataService
});

/**
 * Action creator for data service updated events.
 */
export const dataServiceUpdated = (dataService: DataService) => ({
  type: DATA_SERVICE_UPDATED,
  dataService: dataService
});
