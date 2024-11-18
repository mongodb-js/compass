import { combineReducers } from 'redux';
import type { Action, AnyAction } from 'redux';
import type AppRegistry from 'hadron-app-registry';
import isWritable from './is-writable';
import indexView from './index-view';
import isReadonlyView from './is-readonly-view';
import isSearchIndexesSupported from './is-search-indexes-supported';
import description from './description';
import regularIndexes from './regular-indexes';
import searchIndexes from './search-indexes';
import serverVersion from './server-version';
import namespace from './namespace';
import createIndex from './create-index';
import collectionStats from './collection-stats';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import type { DataService } from 'mongodb-data-service';
import type { Logger } from '@mongodb-js/compass-logging';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import type { IndexesDataServiceProps } from '../stores/store';
import type { Collection } from '@mongodb-js/compass-app-stores/provider';
import type { RollingIndexesService } from './rolling-indexes-service';
import type { PreferencesAccess } from 'compass-preferences-model';
const reducer = combineReducers({
  // From instance.isWritable. Used to know if the create button should be
  // enabled.
  isWritable,

  // Is this collection readonly. (ultimately from isReadonly on
  // CollectionProps) Used to know if many things should even be visible.
  isReadonlyView,

  // Does this collection support search indexes
  isSearchIndexesSupported,

  // 'regular-indexes' or 'search-indexes'
  indexView,

  // Used as writeStateDescription when the create button is shown but disabled.
  // (isReadonlyView = false a&& isWritable == false)
  description,

  // Used with serverSupportsHideIndex(),
  // isAtlasVectorSearchSupportedForServerVersion() and
  // hasColumnstoreIndexesSupport()
  serverVersion,

  // The collection the indexes are for.
  namespace,

  // The regular indexes including in-progress regular indexes and other state around the table of indexes
  regularIndexes,

  // The search indexes, state for the table of search indexes and create/update search index modals
  searchIndexes,

  // State for the create regular index form
  createIndex,

  // The stats for the collection
  collectionStats,
});

export type SortDirection = 'asc' | 'desc';

export type RootState = ReturnType<typeof reducer>;
export type IndexesExtraArgs = {
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  logger: Logger;
  track: TrackFunction;
  dataService: Pick<DataService, IndexesDataServiceProps>;
  connectionInfoRef: ConnectionInfoRef;
  collection: Collection;
  rollingIndexesService: RollingIndexesService;
  pollingIntervalRef: {
    regularIndexes: ReturnType<typeof setInterval> | null;
    searchIndexes: ReturnType<typeof setInterval> | null;
  };
  preferences: PreferencesAccess;
};
export type IndexesThunkDispatch<A extends Action = AnyAction> = ThunkDispatch<
  RootState,
  IndexesExtraArgs,
  A
>;
export type IndexesThunkAction<R, A extends Action> = ThunkAction<
  R,
  RootState,
  IndexesExtraArgs,
  A
>;

export default reducer;
