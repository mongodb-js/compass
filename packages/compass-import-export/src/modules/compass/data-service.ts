import type { DataService } from 'mongodb-data-service';
import type { AnyAction } from 'redux';

/**
 * Action for the dataService connection.
 */
export const DATA_SERVICE_CONNECTED =
  'import-export/data-service/DATA_SERVICE_CONNECTED';
export const DATA_SERVICE_DISCONNECTED =
  'import-export/data-service/DATA_SERVICE_DISCONNECTED';

type State = {
  dataService?: DataService;
  error?: Error;
};

function getInitialState(): State {
  return {};
}

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

export const dataServiceDisconnected = () => {
  return {
    type: DATA_SERVICE_DISCONNECTED,
  };
};

const reducer = (
  state: State = getInitialState(),
  action: AnyAction
): State => {
  if (action.type === DATA_SERVICE_CONNECTED) {
    return {
      error: action.error,
      dataService: action.dataService,
    };
  }
  if (action.type === DATA_SERVICE_DISCONNECTED) {
    return getInitialState();
  }
  return state;
};

export default reducer;
