import type { Reducer } from 'redux';
import type { DataService } from 'mongodb-data-service';

export type State = DataService | null;

export enum ActionTypes {
  SetDataService = 'compass-saved-aggregations-queries/setDataService',
  ResetDataService = 'compass-saved-aggregations-queries/resetDataService',
}

type SetDataServiceAction = {
  type: ActionTypes.SetDataService;
  dataService: DataService;
};

type ResetDataServiceAction = { type: ActionTypes.ResetDataService };

export type Actions = SetDataServiceAction | ResetDataServiceAction;

export function setDataService(dataService: DataService): SetDataServiceAction {
  return { type: ActionTypes.SetDataService, dataService };
}

export function resetDataService(): ResetDataServiceAction {
  return { type: ActionTypes.ResetDataService };
}

const reducer: Reducer<State, Actions> = (state = null, action) => {
  switch (action.type) {
    case ActionTypes.SetDataService:
      return action.dataService;
    case ActionTypes.ResetDataService:
      return null;
    default:
      return state;
  }
};

export default reducer;
