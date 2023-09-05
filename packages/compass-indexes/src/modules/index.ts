import { combineReducers } from 'redux';
import type { AnyAction } from 'redux';
import appRegistry from '@mongodb-js/mongodb-redux-common/app-registry';
import dataService from './data-service';
import { RESET_FORM } from './reset-form';
import isWritable, {
  INITIAL_STATE as WRITABLE_INITIAL_STATE,
} from './is-writable';
import isReadonlyView, {
  INITIAL_STATE as READONLY_VIEW_INITIAL_STATE,
} from './is-readonly-view';
import description, {
  INITIAL_STATE as DESCRIPTION_INITIAL_STATE,
} from './description';
import regularIndexes, {
  INITIAL_STATE as REGULAR_INDEXES_INITIAL_STATE,
} from './regular-indexes';
import error, { INITIAL_STATE as ERROR_INITIAL_STATE } from './error';
import serverVersion, {
  INITIAL_STATE as SV_INITIAL_STATE,
} from './server-version';
import namespace, {
  INITIAL_STATE as NAMESPACE_INITIAL_STATE,
} from './namespace';

const reducer = combineReducers({
  isWritable,
  isReadonlyView,
  description,
  appRegistry,
  dataService,
  error,
  serverVersion,
  namespace,
  regularIndexes,
});

export type RootState = ReturnType<typeof reducer>;

const rootReducer = (state: RootState, action: AnyAction): RootState => {
  if (action.type === RESET_FORM) {
    return {
      ...state,
      isWritable: WRITABLE_INITIAL_STATE,
      isReadonlyView: READONLY_VIEW_INITIAL_STATE,
      description: DESCRIPTION_INITIAL_STATE,
      serverVersion: SV_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
      namespace: NAMESPACE_INITIAL_STATE,
      regularIndexes: REGULAR_INDEXES_INITIAL_STATE,
    };
  }
  return reducer(state, action);
};

export default rootReducer;
