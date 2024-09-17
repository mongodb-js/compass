import type { Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import type { IndexesThunkDispatch, RootState } from '../modules';
import reducer from '../modules';
import thunk from 'redux-thunk';
import { writeStateChanged } from '../modules/is-writable';
import { getDescription } from '../modules/description';
import { INITIAL_STATE as INDEX_LIST_INITIAL_STATE } from '../modules/index-view';
import {
  fetchIndexes,
  inProgressIndexAdded,
  inProgressIndexRemoved,
  inProgressIndexFailed,
  type InProgressIndex,
} from '../modules/regular-indexes';
import {
  INITIAL_STATE as SEARCH_INDEXES_INITIAL_STATE,
  refreshSearchIndexes,
  SearchIndexesStatuses,
  showCreateModal,
} from '../modules/search-indexes';
import type { DataService } from 'mongodb-data-service';
import type AppRegistry from 'hadron-app-registry';
import { switchToRegularIndexes } from '../modules/index-view';
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
          ? SearchIndexesStatuses.NOT_READY
          : SearchIndexesStatuses.NOT_AVAILABLE,
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

  on(localAppRegistry, 'refresh-regular-indexes', () => {
    localAppRegistry.emit('refresh-collection-stats');
    void store.dispatch(fetchIndexes());
  });

  on(
    localAppRegistry,
    'in-progress-indexes-added',
    (index: InProgressIndex) => {
      store.dispatch(inProgressIndexAdded(index));
      // we have to merge the in-progress indexes with the regular indexes, so
      // just fetch them again which will perform the merge
      void store.dispatch(fetchIndexes());
      store.dispatch(switchToRegularIndexes());
    }
  );

  on(localAppRegistry, 'in-progress-indexes-removed', (id: string) => {
    store.dispatch(inProgressIndexRemoved(id));
  });

  on(
    localAppRegistry,
    'in-progress-indexes-failed',
    (data: { inProgressIndexId: string; error: string }) => {
      store.dispatch(inProgressIndexFailed(data));
    }
  );

  on(localAppRegistry, 'open-create-search-index-modal', () => {
    store.dispatch(showCreateModal());
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

  return { store, deactivate: () => cleanup() };
}
