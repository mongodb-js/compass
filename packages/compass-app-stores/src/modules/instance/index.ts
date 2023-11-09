import { combineReducers } from 'redux';
import type { ErrorMessageAction, ErrorMessageState } from './error-message';
import errorMessage, {
  INITIAL_STATE as ERROR_MESSAGE_INITIAL_STATE,
} from './error-message';
import type { InstanceAction, InstanceState } from './instance';
import instance, { INITIAL_STATE as INSTANCE_INITIAL_STATE } from './instance';
import type { DataServiceAction, DataServiceState } from './data-service';
import dataService, {
  INITIAL_STATE as DATA_SERVICE_INITIAL_STATE,
} from './data-service';

import type { ResetAction } from './reset';
import { RESET } from './reset';

export type RootState = {
  dataService: DataServiceState;
  errorMessage: ErrorMessageState;
  instance: InstanceState;
};
export type RootAction =
  | DataServiceAction
  | ErrorMessageAction
  | InstanceAction
  | ResetAction;

const reducer = combineReducers<RootState, RootAction>({
  errorMessage,
  instance,
  dataService,
});

const rootReducer = (state: RootState | undefined, action: RootAction) => {
  if (action.type === RESET) {
    return {
      ...state,
      errorMessage: ERROR_MESSAGE_INITIAL_STATE,
      instance: INSTANCE_INITIAL_STATE,
      dataService: DATA_SERVICE_INITIAL_STATE,
    };
  }
  return reducer(state, action);
};

export default rootReducer;
