import type AppRegistry from 'hadron-app-registry';
import type { AnyAction, Store } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import thunk from 'redux-thunk';
import type { DataService } from 'mongodb-data-service';
import type { CollectionTabsState } from '../modules/tabs';
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

type ThunkExtraArg = {
  globalAppRegistry: AppRegistry;
  dataService: DataService | null;
};

type RootStore = Store<CollectionTabsState, AnyAction> & {
  dispatch: ThunkDispatch<
    any,
    {
      globalAppRegistry: Readonly<AppRegistry>;
      dataService: DataService | null;
    },
    AnyAction
  >;
} & {
  onActivated(globalAppRegistry: AppRegistry): void;
};

export function configureStore({
  globalAppRegistry: _globalAppRegistry,
  dataService,
}: Partial<ThunkExtraArg> = {}): RootStore {
  const thunkExtraArg = {
    globalAppRegistry: _globalAppRegistry ?? globalAppRegistry,
    dataService: dataService ?? null,
  };

  const store = createStore(
    tabs,
    applyMiddleware(thunk.withExtraArgument(thunkExtraArg))
  );

  Object.assign(store, {
    onActivated: (globalAppRegistry: AppRegistry) => {
      thunkExtraArg.globalAppRegistry = globalAppRegistry;
      /**
       * When emitted, will always open a collection namespace in new tab
       */
      globalAppRegistry.on('open-namespace-in-new-tab', (metadata) => {
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
          thunkExtraArg.dataService = dataService;
          store.dispatch(dataServiceConnected());
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
    },
  });

  return store as RootStore;
}

const store = configureStore();

export type RootState = ReturnType<typeof store['getState']>;

export default store;
