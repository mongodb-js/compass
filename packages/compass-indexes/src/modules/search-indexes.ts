import type { AnyAction } from 'redux';
import { isAction } from './../utils/is-action';

export enum SearchIndexesStatuses {
  /**
   * No support. Default status.
   */
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  /**
   * Supported, but we do not have list of indexes yet.
   */
  PENDING = 'PENDING',
  /**
   * Supported and we have list of indexes.
   */
  READY = 'READY',
  /**
   * Supported and we are refreshing the list.
   */
  REFRESHING = 'REFRESHING',
}

type SearchIndexesStatus = keyof typeof SearchIndexesStatuses;

export enum ActionTypes {
  SetStatus = 'indexes/regular-indexes/SetStatus',
}

type SetStatusAction = {
  type: ActionTypes.SetStatus;
  status: SearchIndexesStatus;
};

export type State = {
  status: SearchIndexesStatus;
};

export const INITIAL_STATE: State = {
  status: 'NOT_AVAILABLE',
};

export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (isAction<SetStatusAction>(action, ActionTypes.SetStatus)) {
    return {
      ...state,
      status: action.status,
    };
  }

  return state;
}

export const setStatus = (status: SearchIndexesStatus): SetStatusAction => ({
  type: ActionTypes.SetStatus,
  status,
});
