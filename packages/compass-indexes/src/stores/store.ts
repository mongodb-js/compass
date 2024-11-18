import type { Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import type { IndexesThunkDispatch, RootState } from '../modules';
import reducer from '../modules';
import thunk from 'redux-thunk';
import { writeStateChanged } from '../modules/is-writable';
import { getDescription } from '../modules/description';
import { INITIAL_STATE as INDEX_LIST_INITIAL_STATE } from '../modules/index-view';
import { createIndexOpened } from '../modules/create-index';
import {
  fetchRegularIndexes,
  stopPollingRegularIndexes,
} from '../modules/regular-indexes';
import {
  fetchSearchIndexes,
  createSearchIndexOpened,
  stopPollingSearchIndexes,
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
  extractCollectionStats,
} from '../modules/collection-stats';
import type { AtlasService } from '@mongodb-js/atlas-service/provider';
import { RollingIndexesService } from '../modules/rolling-indexes-service';
import type { PreferencesAccess } from 'compass-preferences-model';

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
  atlasService: AtlasService;
  preferences: PreferencesAccess;
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
    atlasService,
    preferences,
  }: IndexesPluginServices,
  { on, cleanup, addCleanup }: ActivateHelpers
) {
  const pollingIntervalRef = {
    regularIndexes: null,
    searchIndexes: null,
  };

  const store: IndexesStore = createStore(
    reducer,
    {
      isWritable: instance.isWritable,
      description: instance.description,
      namespace: options.namespace,
      serverVersion: options.serverVersion,
      isReadonlyView: options.isReadonly,
      isSearchIndexesSupported: options.isSearchIndexesSupported,
      indexView: INDEX_LIST_INITIAL_STATE,
      collectionStats: extractCollectionStats(collectionModel),
    },
    applyMiddleware(
      thunk.withExtraArgument({
        localAppRegistry,
        globalAppRegistry,
        logger,
        track,
        connectionInfoRef,
        dataService,
        collection: collectionModel,
        rollingIndexesService: new RollingIndexesService(
          atlasService,
          connectionInfoRef
        ),
        pollingIntervalRef,
        preferences,
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
    void store.dispatch(fetchRegularIndexes());
    if (options.isSearchIndexesSupported) {
      void store.dispatch(fetchRegularIndexes());
    }
  });

  // these can change later
  on(instance, 'change:isWritable', () => {
    store.dispatch(writeStateChanged(instance.isWritable));
  });
  on(instance, 'change:description', () => {
    store.dispatch(getDescription(instance.description));
  });

  void store.dispatch(fetchRegularIndexes());
  if (options.isSearchIndexesSupported) {
    void store.dispatch(fetchSearchIndexes());
  }

  on(collectionModel, 'change:status', (model: Collection, status: string) => {
    if (status === 'ready') {
      store.dispatch(collectionStatsFetched(model));
    }
  });

  addCleanup(() => {
    store.dispatch(stopPollingRegularIndexes());
    store.dispatch(stopPollingSearchIndexes());
  });

  return { store, deactivate: () => cleanup() };
}
