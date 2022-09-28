import type { ThunkAction } from 'redux-thunk';
import type { RootState } from './index';
import { fetchIndexes } from './indexes';

export enum ActionTypes {
  RefreshStarted = 'indexes/is-refreshing/RefreshStarted',
  RefreshFinished = 'indexes/is-refreshing/RefreshFinished',
}

type RefreshStartedAction = {
  type: ActionTypes.RefreshStarted;
};

export type RefreshFinishedAction = {
  type: ActionTypes.RefreshFinished;
};

type Actions = RefreshStartedAction | RefreshFinishedAction;

type State = boolean;

export const INITIAL_STATE: State = false;

export default function reducer(state = INITIAL_STATE, action: Actions) {
  if (action.type === ActionTypes.RefreshStarted) {
    return true;
  }
  if (action.type === ActionTypes.RefreshFinished) {
    return false;
  }
  return state;
}

export const refreshIndexes = (): ThunkAction<
  void,
  RootState,
  void,
  Actions
> => {
  return (dispatch) => {
    dispatch(fetchIndexes());
    dispatch({
      type: ActionTypes.RefreshStarted,
    });
  };
};
