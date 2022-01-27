import { Reducer } from 'redux';

// TODO: add types for whatever we will be using in this plugin and maybe move
//       them to the model package
type MongoDBInstance = Record<string, unknown>;

export type State = MongoDBInstance | null;

export enum ActionTypes {
  SetInstance = 'compass-saved-aggregations-queries/setInstance',
  ResetInstance = 'compass-saved-aggregations-queries/resetInstance',
}

type SetInstanceAction = {
  type: ActionTypes.SetInstance;
  instance: MongoDBInstance;
};

type ResetInstanceAction = { type: ActionTypes.ResetInstance };

export type Actions = SetInstanceAction | ResetInstanceAction;

export function setInstance(instance: MongoDBInstance): SetInstanceAction {
  return { type: ActionTypes.SetInstance, instance };
}

export function resetInstance(): ResetInstanceAction {
  return { type: ActionTypes.ResetInstance };
}

const reducer: Reducer<State, Actions> = (state = null, action) => {
  switch (action.type) {
    case ActionTypes.SetInstance:
      return action.instance;
    case ActionTypes.ResetInstance:
      return null;
    default:
      return state;
  }
};

export default reducer;
