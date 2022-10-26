import { combineReducers } from 'redux';
import type { AnyAction } from 'redux';
import appRegistry from '@mongodb-js/mongodb-redux-common/app-registry';
import dataService from './data-service';
import { RESET_FORM } from './reset-form';
import isWritable, {
  INITIAL_STATE as WRITABLE_INITIAL_STATE,
} from './is-writable';
import isReadonly, {
  INITIAL_STATE as READONLY_INITIAL_STATE,
} from './is-readonly';
import preferencesReadOnly, {
  INITIAL_STATE as PREFERENCES_READONLY_INITIAL_STATE,
} from './preferences-readonly';
import isReadonlyView, {
  INITIAL_STATE as READONLY_VIEW_INITIAL_STATE,
} from './is-readonly-view';
import description, {
  INITIAL_STATE as DESCRIPTION_INITIAL_STATE,
} from './description';
import indexes, { INITIAL_STATE as INDEXES_INITIAL_STATE } from './indexes';
import sortOrder, {
  INITIAL_STATE as SORT_ORDER_INITIAL_STATE,
} from './sort-order';
import sortColumn, {
  INITIAL_STATE as SORT_COLUMN_INITIAL_STATE,
} from './sort-column';
import error, { INITIAL_STATE as ERROR_INITIAL_STATE } from './error';
import serverVersion, {
  INITIAL_STATE as SV_INITIAL_STATE,
} from './server-version';
import namespace, {
  INITIAL_STATE as NAMESPACE_INITIAL_STATE,
} from './namespace';
import isRefreshing, {
  INITIAL_STATE as REFRESHING_INITIAL_STATE,
} from './is-refreshing';
import inProgressIndexes from './in-progress-indexes';

const reducer = combineReducers({
  indexes,
  isWritable,
  isReadonly,
  isReadonlyView,
  preferencesReadOnly,
  description,
  appRegistry,
  dataService,
  sortOrder,
  sortColumn,
  error,
  serverVersion,
  namespace,
  isRefreshing,
  inProgressIndexes,
});

export type RootState = ReturnType<typeof reducer>;

const rootReducer = (state: RootState, action: AnyAction): RootState => {
  if (action.type === RESET_FORM) {
    return {
      ...state,
      isWritable: WRITABLE_INITIAL_STATE,
      isReadonly: READONLY_INITIAL_STATE,
      isReadonlyView: READONLY_VIEW_INITIAL_STATE,
      preferencesReadOnly: PREFERENCES_READONLY_INITIAL_STATE,
      description: DESCRIPTION_INITIAL_STATE,
      indexes: INDEXES_INITIAL_STATE,
      serverVersion: SV_INITIAL_STATE,
      sortOrder: SORT_ORDER_INITIAL_STATE,
      sortColumn: SORT_COLUMN_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
      namespace: NAMESPACE_INITIAL_STATE,
      isRefreshing: REFRESHING_INITIAL_STATE,
    };
  }
  return reducer(state, action);
};

export default rootReducer;
