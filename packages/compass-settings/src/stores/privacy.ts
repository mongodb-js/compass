import type { ActionCreator, Reducer } from 'redux';

export type State = {
  autoUpdates: boolean;
  enableMaps: boolean;
  trackErrors: boolean;
  trackUsageStatistics: boolean;
  enableFeedbackPanel: boolean;
};

const INITIAL_STATE: State = {
  autoUpdates: false,
  enableMaps: false,
  trackErrors: false,
  trackUsageStatistics: false,
  enableFeedbackPanel: false,
};

export enum ActionTypes {
  ChangeField = 'compass-settings/privacy/changeField',
}

type ChangeFieldAction = {
  type: ActionTypes.ChangeField;
  key: string;
  value: boolean;
};

export type Actions = ChangeFieldAction;

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.ChangeField:
      return {
        ...state,
        [action.key]: action.value,
      };
    default:
      return state;
  }
};

export const changeValue: ActionCreator<ChangeFieldAction> = (field: string, value: boolean) => {
  return {
    type: ActionTypes.ChangeField,
    key: field,
    value
  };
};

export default reducer;
