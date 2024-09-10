import type { Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import type { IndexesThunkDispatch, RootState } from '../modules';
import reducer from '../modules';
import thunk from 'redux-thunk';
import { writeStateChanged } from '../modules/is-writable';
import { getDescription } from '../modules/description';
import { INITIAL_STATE as INDEX_LIST_INITIAL_STATE } from '../modules/index-view';
import { toggleIsVisible } from '../modules/create-index';
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
import type { ConnectionInfoAccess } from '@mongodb-js/compass-connections/provider';

import { openToast, showConfirmation } from '@mongodb-js/compass-components';

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
  connectionInfoAccess: ConnectionInfoAccess;
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
    connectionInfoAccess,
    instance,
    localAppRegistry,
    globalAppRegistry,
    logger,
    track,
    dataService,
  }: IndexesPluginServices,
  { on, cleanup, signal }: ActivateHelpers
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
        connectionInfoAccess,
        dataService,
      })
    )
  );

  // TODO: replace
  on(localAppRegistry, 'open-drop-index-modal', async (indexName: string) => {
    try {
      const connectionInfo = connectionInfoAccess.getCurrentConnectionInfo();
      track('Screen', { name: 'drop_index_modal' }, connectionInfo);
      const confirmed = await showConfirmation({
        variant: 'danger',
        title: 'Drop Index',
        description: `Are you sure you want to drop index "${indexName}"?`,
        requiredInputText: indexName,
        buttonText: 'Drop',
        signal,
        'data-testid': 'drop-index-modal',
      });
      if (!confirmed) {
        return;
      }
      await dataService.dropIndex(options.namespace, indexName);
      track('Index Dropped', { atlas_search: false }, connectionInfo);
      localAppRegistry.emit('refresh-regular-indexes');
      openToast('drop-index-success', {
        variant: 'success',
        title: `Index "${indexName}" dropped`,
        timeout: 3000,
      });
    } catch (err) {
      if (signal.aborted) {
        return;
      }
      openToast('drop-index-error', {
        variant: 'important',
        title: `Failed to drop index "${indexName}"`,
        description: (err as Error).message,
        timeout: 3000,
      });
    }
  });

  // TODO: replace
  on(localAppRegistry, 'open-create-index-modal', () => {
    store.dispatch(toggleIsVisible(true));
  });

  // TODO: replace
  on(localAppRegistry, 'refresh-regular-indexes', () => {
    localAppRegistry.emit('refresh-collection-stats');
    void store.dispatch(fetchIndexes());
  });

  // TODO: replace
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

  // TODO: replace
  on(localAppRegistry, 'in-progress-indexes-removed', (id: string) => {
    store.dispatch(inProgressIndexRemoved(id));
  });

  // TODO: replace
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
