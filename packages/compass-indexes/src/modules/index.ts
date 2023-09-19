import { combineReducers } from 'redux';
import type { Action, AnyAction } from 'redux';
import appRegistry from '@mongodb-js/mongodb-redux-common/app-registry';
import dataService from './data-service';
import isWritable from './is-writable';
import isReadonlyView from './is-readonly-view';
import description from './description';
import instance from './instance';
import regularIndexes from './regular-indexes';
import searchIndexes from './search-indexes';
import serverVersion from './server-version';
import namespace from './namespace';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';

const reducer = combineReducers({
  isWritable,
  isReadonlyView,
  description,
  instance,
  appRegistry,
  dataService,
  serverVersion,
  namespace,
  regularIndexes,
  searchIndexes,
});

export type SortDirection = 'asc' | 'desc';

export type RootState = ReturnType<typeof reducer>;
export type IndexesThunkDispatch<A extends AnyAction> = ThunkDispatch<
  RootState,
  unknown,
  A
>;
export type IndexesThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  RootState,
  unknown,
  A
>;

export default reducer;
