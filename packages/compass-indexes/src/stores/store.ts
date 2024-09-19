import type { Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import type { IndexesThunkDispatch, RootState } from '../modules';
import reducer from '../modules';
import thunk from 'redux-thunk';
import { writeStateChanged } from '../modules/is-writable';
import { getDescription } from '../modules/description';
import { INITIAL_STATE as INDEX_LIST_INITIAL_STATE } from '../modules/index-view';
import { createIndexOpened } from '../modules/create-index';
import { fetchIndexes } from '../modules/regular-indexes';
import {
  INITIAL_STATE as SEARCH_INDEXES_INITIAL_STATE,
  refreshSearchIndexes,
  SearchIndexesStatuses,
  createSearchIndexOpened,
} from '../modules/search-indexes';
import type { DataService } from 'mongodb-data-service';
import type AppRegistry from 'hadron-app-registry';
import type { ActivateHelpers } from 'hadron-app-registry';
import type {
  MongoDBInstance,
  Collection,
} from '@mongodb-js/compass-app-stores/provider';
import type { Logger } from '@mongodb-js/compass-logging';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import {
  collectionStatsFetched,
  pickCollectionIndexStats,
} from '../modules/stats';

export type IndexesDataServiceProps =
  | 'indexes'
  | 'isConnected'
  | 'updateCollection'
  | 'createIndex'
  | 'dropIndex'
  | 'getSearchIndexes'
  | 'createSearchIndex'
  | 'updateSearchIndex'
  | 'dropSearchIndex'
  // Required for collection model (fetching stats)
  | 'collectionStats'
  | 'collectionInfo'
  | 'listCollections'
  | 'isListSearchIndexesSupported';
export type IndexesDataService = Pick<DataService, IndexesDataServiceProps>;

export type IndexesPluginServices = {
  dataService: IndexesDataService;
  connectionInfoRef: ConnectionInfoRef;
  instance: MongoDBInstance;
  localAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  globalAppRegistry: Pick<AppRegistry, 'on' | 'emit' | 'removeListener'>;
  logger: Logger;
  collection: Collection;
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
    collection: collectionModel,
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
          ? SearchIndexesStatuses.NOT_READY
          : SearchIndexesStatuses.NOT_AVAILABLE,
      },
      stats: pickCollectionIndexStats(collectionModel),
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
    void store.dispatch(fetchIndexes());
    void store.dispatch(refreshSearchIndexes());
  });

  // these can change later
  on(instance, 'change:isWritable', () => {
    store.dispatch(writeStateChanged(instance.isWritable));
  });
  on(instance, 'change:description', () => {
    store.dispatch(getDescription(instance.description));
  });

  on(collectionModel, 'change:status', (model: Collection, status: string) => {
    if (status === 'ready') {
      store.dispatch(collectionStatsFetched(model));
    }
  });

  on(localAppRegistry, 'refresh-collection-stats', () => {
    void collectionModel.fetch({ dataService, force: true });
  });

  return { store, deactivate: () => cleanup() };
}
