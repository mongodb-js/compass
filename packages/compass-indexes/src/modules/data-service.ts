import type { DataService } from 'mongodb-data-service';

export enum ActionTypes {
  DataServiceConnected = 'indexes/data-service/DATA_SERVICE_CONNECTED',
}

type DataServiceConnectedAction = {
  type: ActionTypes.DataServiceConnected;
  dataService: DataService;
};

type State = DataService | null;

const INITIAL_STATE: State = null;

export default function reducer(
  state = INITIAL_STATE,
  action: DataServiceConnectedAction
) {
  if (action.type === ActionTypes.DataServiceConnected) {
    return action.dataService;
  }
  return state;
}

export const dataServiceConnected = (dataService: DataService) => ({
  type: ActionTypes.DataServiceConnected,
  dataService,
});
