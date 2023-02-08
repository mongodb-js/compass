import { MongoError } from 'mongodb';
import type { AnyError } from 'mongodb';
import { RESET_FORM } from './reset-form';
import type { AnyAction } from 'redux';

export type IndexesError = AnyError | string | null | undefined;

export enum ActionTypes {
  HandleError = 'indexes/error/HANDLE_ERROR',
  ClearError = 'indexes/error/CLEAR_ERROR',
}

export type HandleErrorAction = {
  type: ActionTypes.HandleError;
  error: IndexesError;
};

type ClearErrorAction = {
  type: ActionTypes.ClearError;
};

export type Actions = HandleErrorAction | ClearErrorAction;

type State = string | null;
export const INITIAL_STATE: State = null;

export default function reducer(
  state: State = INITIAL_STATE,
  action: AnyAction
) {
  if (action.type === ActionTypes.HandleError) {
    return _parseError(action.error as Error);
  }
  if (action.type === ActionTypes.ClearError) {
    return INITIAL_STATE;
  }
  if (action.type === RESET_FORM) {
    return INITIAL_STATE;
  }
  return state;
}

export const handleError = (error: IndexesError): HandleErrorAction => ({
  type: ActionTypes.HandleError,
  error,
});

export const clearError = (): ClearErrorAction => ({
  type: ActionTypes.ClearError,
});

/**
 * Data Service attaches string message property for some errors, but not all
 * that can happen during index creation/dropping.
 * Check for data service custom error, then node driver errmsg.
 */
const _parseError = (err: IndexesError): string => {
  if (typeof err === 'string') {
    return err;
  }
  if (typeof err?.message === 'string') {
    return err.message;
  }
  if (err instanceof MongoError && err.errmsg === 'string') {
    return err.errmsg;
  }
  return 'Unknown error';
};
