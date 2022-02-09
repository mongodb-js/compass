import type AppRegistry from 'hadron-app-registry';
import type { ActionCreator, Reducer } from 'redux';

export type State = AppRegistry | null;

export enum ActionTypes {
  SetAppRegistry = 'compass-saved-aggregations-queries/setAppRegistry',
}

type SetAppRegistryAction = {
  type: ActionTypes.SetAppRegistry;
  appRegistry: AppRegistry;
};

export type Actions = SetAppRegistryAction;

const INITIAL_STATE = null;

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  if (action.type === ActionTypes.SetAppRegistry) {
    return action.appRegistry;
  }
  return state;
};

export const setAppRegistry: ActionCreator<SetAppRegistryAction> = (
  appRegistry: AppRegistry
) => {
  return { type: ActionTypes.SetAppRegistry, appRegistry };
};

export default reducer;
