import type { MongoDBInstance } from 'mongodb-instance-model';
import type { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';

type State = MongoDBInstance | null;

enum ActionTypes {
  SetInstance = 'indexes/setInstance',
}

type SetInstanceAction = {
  type: ActionTypes.SetInstance;
  instance: MongoDBInstance | null;
};

export function setInstance(
  instance: MongoDBInstance | null
): SetInstanceAction {
  return { type: ActionTypes.SetInstance, instance };
}

const reducer = (state: State = null, action: AnyAction) => {
  if (isAction<SetInstanceAction>(action, ActionTypes.SetInstance)) {
    return action.instance;
  }
  return state;
};

export default reducer;
