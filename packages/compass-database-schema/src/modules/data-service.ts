import type { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';
import type { DataService } from 'mongodb-data-service';

export enum ActionTypes {
  ConnectDataService = 'database-schema/data-service/Connected',
  DisconnectDataService = 'database-schem/data-service/Disconnected',
}

type ConnectDataServiceAction = {
  type: ActionTypes.ConnectDataService;
  dataService: DataService;
};

type DisconnectDataServiceAction = {
  type: ActionTypes.DisconnectDataService;
};

export type State = {
  dataService?: DataService;
};

export const INITIAL_STATE: State = {
  dataService: undefined,
};

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
  if (
    isAction<ConnectDataServiceAction>(action, ActionTypes.ConnectDataService)
  ) {
    return { ...state, dataService: action.dataService };
  } else if (
    isAction<DisconnectDataServiceAction>(
      action,
      ActionTypes.DisconnectDataService
    )
  ) {
    return { ...state, dataService: undefined };
  }

  return state;
}

export const connectDataService = (dataService: DataService) => ({
  type: ActionTypes.ConnectDataService,
  dataService,
});

export const disconnectDataService = () => ({
  type: ActionTypes.DisconnectDataService,
});
