import type { DataService } from 'mongodb-data-service';
import type { RootAction, SidebarThunkAction } from '.';

export const SET_DATASERVICE = 'sidebar/SET_DATASERVICE' as const;
interface SetDataServiceAction {
  type: typeof SET_DATASERVICE;
  dataService: DataService;
}
export const SET_CSFLE_ENABLED = 'sidebar/SET_CSFLE_ENABLED' as const;
interface SetCSFLEEnabledAction {
  type: typeof SET_CSFLE_ENABLED;
  enable: boolean;
}
export type DataServiceAction = SetDataServiceAction | SetCSFLEEnabledAction;
export type DataServiceState = DataService | null;

export const INITIAL_STATE: DataServiceState = null;

export default function reducer(
  state: DataServiceState = INITIAL_STATE,
  action: RootAction
): DataServiceState {
  if (action.type === SET_DATASERVICE) {
    return action.dataService;
  }
  if (action.type === SET_CSFLE_ENABLED) {
    state?.setCSFLEEnabled(action.enable);
  }
  return state;
}

export const setDataService = (
  dataService: DataService
): SetDataServiceAction => ({
  type: SET_DATASERVICE,
  dataService,
});

export const setConnectionIsCSFLEEnabled = (
  enable: boolean
): SidebarThunkAction<void, SetCSFLEEnabledAction> => {
  return (dispatch, _getState, { globalAppRegistry }) => {
    dispatch({ type: SET_CSFLE_ENABLED, enable });
    queueMicrotask(() => {
      globalAppRegistry?.emit('refresh-data');
    });
  };
};
