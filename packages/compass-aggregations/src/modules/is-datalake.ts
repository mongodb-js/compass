import type { Reducer } from 'redux';

enum ActionTypes {
  SetDataLake = 'compass-aggregations/setDataLake',
};

type SetDataLakeAction = {
  type: ActionTypes.SetDataLake;
  dataLake: boolean;
};

type Actions = SetDataLakeAction;
type State = boolean;

export const INITIAL_STATE: State = false;

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.SetDataLake:
      return action.dataLake;
    default:
      return state;
  }
};

export const setDataLake = (dataLake: boolean): SetDataLakeAction => ({
  type: ActionTypes.SetDataLake,
  dataLake,
});

export default reducer;