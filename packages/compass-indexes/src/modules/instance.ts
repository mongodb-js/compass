import type { MongoDBInstance } from 'mongodb-instance-model';
import type { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';

export type State = MongoDBInstance | null;

export enum ActionTypes {
  SetInstance = 'indexes/setInstance',
  ResetInstance = 'indexes/resetInstance',
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

const reducer = (state: State = null, action: AnyAction) => {
  if (isAction<SetInstanceAction>(action, ActionTypes.SetInstance)) {
    return action.instance;
  }
  if (isAction<ResetInstanceAction>(action, ActionTypes.ResetInstance)) {
    return null;
  }
  return state;
};

export default reducer;
