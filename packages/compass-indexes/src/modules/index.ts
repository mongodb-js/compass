import { combineReducers } from 'redux';
import type { Action, AnyAction } from 'redux';
import type AppRegistry from 'hadron-app-registry';
import dataService from './data-service';
import isWritable from './is-writable';
import indexView from './index-view';
import isReadonlyView from './is-readonly-view';
import description from './description';
import regularIndexes from './regular-indexes';
import searchIndexes from './search-indexes';
import serverVersion from './server-version';
import namespace from './namespace';
import fields from './fields';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';

const reducer = combineReducers({
  isWritable,
  isReadonlyView,
  indexView,
  description,
  dataService,
  serverVersion,
  namespace,
  regularIndexes,
  searchIndexes,
  fields,
});

export type SortDirection = 'asc' | 'desc';

export type RootState = ReturnType<typeof reducer>;
export type IndexesExtraArgs = {
  globalAppRegistry?: AppRegistry;
  localAppRegistry?: AppRegistry;
};
export type IndexesThunkDispatch<A extends AnyAction> = ThunkDispatch<
  RootState,
  IndexesExtraArgs,
  A
>;
export type IndexesThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  RootState,
  IndexesExtraArgs,
  A
>;

export default reducer;
