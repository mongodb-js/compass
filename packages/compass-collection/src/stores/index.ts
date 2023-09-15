import type AppRegistry from 'hadron-app-registry';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import type { DataService } from 'mongodb-data-service';
import tabs, {
  collectionDropped,
  databaseDropped,
  openCollectionInNewTab,
  openCollection,
  getActiveTab,
  dataServiceDisconnected,
  dataServiceConnected,
} from '../modules/tabs';
import { globalAppRegistry } from 'hadron-app-registry';

const thunkExtraArg: {
  globalAppRegistry: AppRegistry;
  dataService: DataService | null;
} = {
  globalAppRegistry,
  dataService: null,
};

const store = createStore(
  tabs,
  applyMiddleware(thunk.withExtraArgument(thunkExtraArg))
);

export type RootState = ReturnType<typeof store['getState']>;

(store as any).onActivated = (globalAppRegistry: AppRegistry) => {
  thunkExtraArg.globalAppRegistry = globalAppRegistry;
  /**
   * When emitted, will always open a collection namespace in new tab
   */
  globalAppRegistry.on('open-namespace-in-new-tab', (metadata) => {
    // TODO: stricter validation
    if (!metadata.namespace) {
      return;
    }
    store.dispatch(openCollectionInNewTab(metadata));
  });

  /**
   * When emitted, will either replace content of the current tab if namespace
   * doesn't match current tab namespace, or will do nothing when "selecting"
   * namespace is the same as currently active
   */
  globalAppRegistry.on('select-namespace', (metadata) => {
    if (!metadata.namespace) {
      return;
    }
    store.dispatch(openCollection(metadata));
  });

  globalAppRegistry.on('collection-dropped', (namespace: string) => {
    store.dispatch(collectionDropped(namespace));
  });

  globalAppRegistry.on('database-dropped', (namespace: string) => {
    store.dispatch(databaseDropped(namespace));
  });

  /**
   * Set the data service in the store when connected.
   */
  globalAppRegistry.on(
    'data-service-connected',
    (error, dataService: DataService) => {
      store.dispatch(dataServiceConnected());
      thunkExtraArg.dataService = dataService;
    }
  );

  /**
   * When we disconnect from the instance, clear all the tabs.
   */
  globalAppRegistry.on('data-service-disconnected', () => {
    store.dispatch(dataServiceDisconnected());
    thunkExtraArg.dataService = null;
  });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ipc = require('hadron-ipc');

  // TODO: importing hadron-ipc in unit tests doesn't work right now
  if (ipc?.on) {
    ipc.on('window:menu-share-schema-json', () => {
      const activeTab = getActiveTab(store.getState());

      if (!activeTab) {
        return;
      }

      activeTab.localAppRegistry.emit('menu-share-schema-json');
    });

    ipc.on('compass:open-export', () => {
      const activeTab = getActiveTab(store.getState());

      if (!activeTab) {
        return;
      }

      globalAppRegistry.emit('open-export', {
        exportFullCollection: true,
        namespace: activeTab.namespace,
        origin: 'menu',
      });
    });

    ipc.on('compass:open-import', () => {
      const activeTab = getActiveTab(store.getState());

      if (!activeTab) {
        return;
      }

      globalAppRegistry.emit('open-import', {
        namespace: activeTab.namespace,
        origin: 'menu',
      });
    });
  }
};

export default store as typeof store & {
  onActivated(globalAppRegistry: AppRegistry): void;
};
