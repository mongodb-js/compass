import type { DataService } from '@mongodb-js/compass-connections/provider';
import type { RootAction, SidebarThunkAction } from '.';
import { ConnectionInfo } from '@mongodb-js/connection-info';

export const SET_DATASERVICE = 'sidebar/SET_DATASERVICE' as const;
interface SetDataServiceAction {
  type: typeof SET_DATASERVICE;
  connectionId: ConnectionInfo['id'];
  dataService: DataService;
}
export const SET_CSFLE_ENABLED = 'sidebar/SET_CSFLE_ENABLED' as const;
interface SetCSFLEEnabledAction {
  type: typeof SET_CSFLE_ENABLED;
  connectionId: ConnectionInfo['id'];
  enable: boolean;
}
export type DataServiceAction = SetDataServiceAction | SetCSFLEEnabledAction;
export type DataServiceState = Record<ConnectionInfo['id'], DataService>;

export const INITIAL_STATE: DataServiceState = {};

export default function reducer(
  state: DataServiceState = INITIAL_STATE,
  action: RootAction
): DataServiceState {
  if (action.type === SET_DATASERVICE) {
    return {
      ...state,
      [action.connectionId]: action.dataService,
    };
  } else if (action.type === SET_CSFLE_ENABLED) {
    state[action.connectionId]?.setCSFLEEnabled(action.enable);
  }

  return state;
}

export const setDataService = (
  connectionId: ConnectionInfo['id'],
  dataService: DataService
): SetDataServiceAction => ({
  type: SET_DATASERVICE,
  connectionId,
  dataService,
});

export const setConnectionIsCSFLEEnabled = (
  connectionId: ConnectionInfo['id'],
  enable: boolean
): SidebarThunkAction<void, SetCSFLEEnabledAction> => {
  return (dispatch, _getState, { globalAppRegistry }) => {
    dispatch({ type: SET_CSFLE_ENABLED, connectionId, enable });
    queueMicrotask(() => {
      globalAppRegistry?.emit('refresh-data');
    });
  };
};
