import { createStore, applyMiddleware } from 'redux';
import reducer from '../modules';
import thunk from 'redux-thunk';
import {
  localAppRegistryActivated,
  globalAppRegistryActivated,
} from '@mongodb-js/mongodb-redux-common/app-registry';
import { writeStateChanged } from '../modules/is-writable';
import { getDescription } from '../modules/description';
import {
  fetchIndexes,
  inProgressIndexAdded,
  inProgressIndexRemoved,
  inProgressIndexFailed,
  type InProgressIndex,
} from '../modules/regular-indexes';
import {
  INITIAL_STATE as SEARCH_INDEXES_INITIAL_STATE,
  fetchSearchIndexes,
  SearchIndexesStatuses,
} from '../modules/search-indexes';
import type { DataService } from 'mongodb-data-service';
import type AppRegistry from 'hadron-app-registry';
import { resetInstance, setInstance } from '../modules/instance';

export type IndexesDataService = Pick<
  DataService,
  | 'indexes'
  | 'isConnected'
  | 'updateCollection'
  | 'createIndex'
  | 'dropIndex'
  | 'getSearchIndexes'
  | 'createSearchIndex'
  | 'updateSearchIndex'
  | 'dropSearchIndex'
>;

export type ConfigureStoreOptions = {
  dataProvider: {
    dataProvider?: IndexesDataService;
  };
  namespace: string;
  localAppRegistry: AppRegistry;
  globalAppRegistry: AppRegistry;
  serverVersion: string;
  isReadonly: boolean;
  isSearchIndexesSupported: boolean;
};

const configureStore = (options: ConfigureStoreOptions) => {
  if (!options.dataProvider?.dataProvider) {
    throw new Error(
      "Can't configure store for indexes plugin without data serivce"
    );
  }
  const store = createStore(
    reducer,
    {
      appRegistry: {
        localAppRegistry: options.localAppRegistry,
        globalAppRegistry: options.globalAppRegistry,
      },
      dataService: options.dataProvider.dataProvider,
      namespace: options.namespace,
      serverVersion: options.serverVersion,
      isReadonlyView: options.isReadonly,
      searchIndexes: {
        ...SEARCH_INDEXES_INITIAL_STATE,
        status: options.isSearchIndexesSupported
          ? SearchIndexesStatuses.PENDING
          : SearchIndexesStatuses.NOT_AVAILABLE,
      },
    },
    applyMiddleware(thunk.withExtraArgument({}))
  );

  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;
    store.dispatch(localAppRegistryActivated(localAppRegistry));

    localAppRegistry.on('refresh-regular-indexes', () => {
      void store.dispatch(fetchIndexes());
    });

    localAppRegistry.on(
      'in-progress-indexes-added',
      (index: InProgressIndex) => {
        store.dispatch(inProgressIndexAdded(index));
      }
    );

    localAppRegistry.on('in-progress-indexes-removed', (id: string) => {
      store.dispatch(inProgressIndexRemoved(id));
    });

    localAppRegistry.on(
      'in-progress-indexes-failed',
      (data: { inProgressIndexId: string; error: string }) => {
        store.dispatch(inProgressIndexFailed(data));
      }
    );
  }

  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;
    store.dispatch(globalAppRegistryActivated(globalAppRegistry));

    globalAppRegistry.on('refresh-data', () => {
      void store.dispatch(fetchIndexes());
      void store.dispatch(fetchSearchIndexes());
    });

    // todo: clean up
    globalAppRegistry.on('instance-created', ({ instance }) => {
      store.dispatch(setInstance(instance));
    });
    // todo: clean up
    globalAppRegistry.on('instance-destroyed', () => {
      store.dispatch(resetInstance());
    });

    const instanceStore: any = globalAppRegistry.getStore('App.InstanceStore');
    if (instanceStore) {
      const instance = instanceStore.getState().instance;
      // set the initial values
      store.dispatch(writeStateChanged(instance.isWritable));
      store.dispatch(getDescription(instance.description));

      // these can change later
      instance.on('change:isWritable', () => {
        store.dispatch(writeStateChanged(instance.isWritable));
      });
      instance.on('change:description', () => {
        store.dispatch(getDescription(instance.description));
      });
    }
  }

  return store;
};

export default configureStore;
