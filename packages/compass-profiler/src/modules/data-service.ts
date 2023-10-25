import { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';
import { ThunkAction } from 'redux-thunk';
import { ProfilerThunkAction } from '.';
import { DataService } from 'mongodb-data-service';

export enum ActionTypes {
  ConnectDataService = 'profiler/data-service/Connected',
  DisconnectDataService = 'profiler/data-service/Disconnected',
  ChooseNamespace = 'profiler/data-service/ChooseNamespace',
}

type ConnectDataServiceAction = {
  type: ActionTypes.ConnectDataService;
  dataService: DataService;
};

type DisconnectDataServiceAction = {
  type: ActionTypes.DisconnectDataService;
};

type ChooseNamespaceAction = {
  type: ActionTypes.ChooseNamespace;
  namespace: string;
};

export type State = {
  dataService?: DataService;
  namespace?: string;
};

export const INITIAL_STATE: State = {
  dataService: undefined,
  namespace: undefined,
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
  } else if (
    isAction<ChooseNamespaceAction>(action, ActionTypes.ChooseNamespace)
  ) {
    return { ...state, namespace: action.namespace };
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

export const chooseNamespace = (ns: string) => ({
  type: ActionTypes.ChooseNamespace,
  namespace: ns,
});
