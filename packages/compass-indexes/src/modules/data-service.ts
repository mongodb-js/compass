import type { IndexesDataService } from '../stores/store';

export enum ActionTypes {
  DataServiceConnected = 'indexes/data-service/DATA_SERVICE_CONNECTED',
}

type DataServiceConnectedAction = {
  type: ActionTypes.DataServiceConnected;
  dataService: IndexesDataService;
};

type State = IndexesDataService | null;

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

export const dataServiceConnected = (dataService: IndexesDataService) => ({
  type: ActionTypes.DataServiceConnected,
  dataService,
});
