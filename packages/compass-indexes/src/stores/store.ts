import type { Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import type { IndexesThunkDispatch, RootState } from '../modules';
import reducer from '../modules';
import thunk from 'redux-thunk';
import { writeStateChanged } from '../modules/is-writable';
import { getDescription } from '../modules/description';
import { INITIAL_STATE as INDEX_LIST_INITIAL_STATE } from '../modules/index-view';
import { createIndexOpened } from '../modules/create-index';
import { refreshRegularIndexes } from '../modules/regular-indexes';
import { FetchStatuses } from '../utils/fetch-status';
import {
  INITIAL_STATE as SEARCH_INDEXES_INITIAL_STATE,
  refreshSearchIndexes,
  createSearchIndexOpened,
} from '../modules/search-indexes';
import type { DataService } from 'mongodb-data-service';
import type AppRegistry from 'hadron-app-registry';
import type { ActivateHelpers } from 'hadron-app-registry';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import type { Logger } from '@mongodb-js/compass-logging';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

export type IndexesDataServiceProps =
  | 'indexes'
  | 'isConnected'
  | 'updateCollection'
  | 'createIndex'
  | 'dropIndex'
  | 'getSearchIndexes'
  | 'createSearchIndex'
  | 'updateSearchIndex'
  | 'dropSearchIndex';
export type IndexesDataService = Pick<DataService, IndexesDataServiceProps>;

export type IndexesPluginServices = {
  dataService: IndexesDataService;
  connectionInfoRef: ConnectionInfoRef;
  instance: MongoDBInstance;
  localAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  globalAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  logger: Logger;
  track: TrackFunction;
};

export type IndexesPluginOptions = {
  namespace: string;
  serverVersion: string;
  isReadonly: boolean;
  isSearchIndexesSupported: boolean;
};

export type IndexesStore = Store<RootState> & {
  dispatch: IndexesThunkDispatch;
};

export function activateIndexesPlugin(
  options: IndexesPluginOptions,
  {
    connectionInfoRef,
    instance,
    localAppRegistry,
    globalAppRegistry,
    logger,
    track,
    dataService,
  }: IndexesPluginServices,
  { on, cleanup }: ActivateHelpers
) {
  const store: IndexesStore = createStore(
    reducer,
    {
      isWritable: instance.isWritable,
      description: instance.description,
      namespace: options.namespace,
      serverVersion: options.serverVersion,
      isReadonlyView: options.isReadonly,
      indexView: INDEX_LIST_INITIAL_STATE,
      searchIndexes: {
        ...SEARCH_INDEXES_INITIAL_STATE,
        status: options.isSearchIndexesSupported
          ? FetchStatuses.NOT_READY
          : FetchStatuses.NOT_AVAILABLE,
      },
    },
    applyMiddleware(
      thunk.withExtraArgument({
        localAppRegistry,
        globalAppRegistry,
        logger,
        track,
        connectionInfoRef,
        dataService,
      })
    )
  );

  on(localAppRegistry, 'open-create-index-modal', () => {
    store.dispatch(createIndexOpened());
  });

  on(localAppRegistry, 'open-create-search-index-modal', () => {
    store.dispatch(createSearchIndexOpened());
  });

  on(globalAppRegistry, 'refresh-data', () => {
    void store.dispatch(refreshRegularIndexes());
    void store.dispatch(refreshSearchIndexes());
  });

  // these can change later
  on(instance, 'change:isWritable', () => {
    store.dispatch(writeStateChanged(instance.isWritable));
  });
  on(instance, 'change:description', () => {
    store.dispatch(getDescription(instance.description));
  });

  void store.dispatch(refreshRegularIndexes());
  if (options.isSearchIndexesSupported) {
    void store.dispatch(refreshSearchIndexes());
  }

  return { store, deactivate: () => cleanup() };
}
