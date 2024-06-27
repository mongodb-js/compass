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
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import type { Logger } from '@mongodb-js/compass-logging';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfoAccess } from '@mongodb-js/compass-connections/provider';

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
});

export type SortDirection = 'asc' | 'desc';

export type RootState = ReturnType<typeof reducer>;
export type IndexesExtraArgs = {
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  logger: Logger;
  track: TrackFunction;
  connectionInfoAccess: ConnectionInfoAccess;
};
export type IndexesThunkDispatch<A extends Action = AnyAction> = ThunkDispatch<
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
