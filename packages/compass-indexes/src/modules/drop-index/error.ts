import type { AnyAction } from 'redux';
import { RESET_FORM } from './../reset-form';
import { isAction } from '../../utils/is-action';
import { type IndexesError, parseError } from '../../utils/parse-error';

export enum ActionTypes {
  HandleError = 'indexes/create-index/HandleError',
  ClearError = 'indexes/create-index/ClearError',
}

type HandleErrorAction = {
  type: ActionTypes.HandleError;
  error: string;
};

type ClearErrorAction = {
  type: ActionTypes.ClearError;
};

type State = string | null;

export const INITIAL_STATE: State = null;

export default function reducer(
  state: State = INITIAL_STATE,
  action: AnyAction
) {
  if (isAction<HandleErrorAction>(action, ActionTypes.HandleError)) {
    return action.error;
  }
  if (
    isAction<ClearErrorAction>(action, ActionTypes.ClearError) ||
    action.type === RESET_FORM
  ) {
    return null;
  }
  return state;
}

export const handleError = (error: IndexesError): HandleErrorAction => ({
  type: ActionTypes.HandleError,
  error: parseError(error),
});

export const clearError = (): ClearErrorAction => ({
  type: ActionTypes.ClearError,
});
