import type AppRegistry from 'hadron-app-registry';
import type { AnyAction } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import type { DataService } from 'mongodb-data-service';
import type { CollectionTabsState } from '../modules/tabs';
import tabs, {
  collectionDropped,
  databaseDropped,
  openCollectionInNewTab,
  openCollection,
  getActiveTab,
} from '../modules/tabs';
import type { CollectionMetadata } from 'mongodb-collection-model';

type CollectionTabsWorkspaceServices = {
  globalAppRegistry: AppRegistry;
  dataService: DataService;
};

export function configureStore(services: CollectionTabsWorkspaceServices) {
  return createStore(tabs, applyMiddleware(thunk.withExtraArgument(services)));
}

export type RootState = ReturnType<
  ReturnType<typeof configureStore>['getState']
>;

export type CollectionTabsThunkAction<
  ReturnType,
  Action extends AnyAction = AnyAction
> = ThunkAction<
  ReturnType,
  CollectionTabsState,
  CollectionTabsWorkspaceServices,
  Action
>;

export function activatePlugin(
  _: unknown,
  { globalAppRegistry, dataService }: CollectionTabsWorkspaceServices
) {
  const store = configureStore({
    globalAppRegistry,
    dataService,
  });

  const cleanup: (() => void)[] = [];

  function subscribeToRegistry(
    appRegistry: AppRegistry,
    name: string,
    fn: (...args: any[]) => any
  ) {
    appRegistry.on(name, fn);
    cleanup.push(() => {
      appRegistry.removeListener(name, fn);
    });
  }

  /**
   * When emitted, will always open a collection namespace in new tab
   */
  subscribeToRegistry(
    globalAppRegistry,
    'open-namespace-in-new-tab',
    (metadata: CollectionMetadata) => {
      store.dispatch(openCollectionInNewTab(metadata));
    }
  );

  /**
   * When emitted, will either replace content of the current tab if namespace
   * doesn't match current tab namespace, or will do nothing when "selecting"
   * namespace is the same as currently active
   */
  subscribeToRegistry(
    globalAppRegistry,
    'select-namespace',
    (metadata: CollectionMetadata) => {
      store.dispatch(openCollection(metadata));
    }
  );

  subscribeToRegistry(
    globalAppRegistry,
    'collection-dropped',
    (namespace: string) => {
      store.dispatch(collectionDropped(namespace));
    }
  );

  subscribeToRegistry(
    globalAppRegistry,
    'database-dropped',
    (namespace: string) => {
      store.dispatch(databaseDropped(namespace));
    }
  );

  subscribeToRegistry(globalAppRegistry, 'menu-share-schema-json', () => {
    const activeTab = getActiveTab(store.getState());
    if (!activeTab) {
      return;
    }
    activeTab.localAppRegistry.emit('menu-share-schema-json');
  });

  subscribeToRegistry(
    globalAppRegistry,
    'open-active-namespace-export',
    function () {
      const activeTab = getActiveTab(store.getState());

      if (!activeTab) {
        return;
      }

      globalAppRegistry.emit('open-export', {
        exportFullCollection: true,
        namespace: activeTab.namespace,
        origin: 'menu',
      });
    }
  );

  subscribeToRegistry(
    globalAppRegistry,
    'open-active-namespace-import',
    function () {
      const activeTab = getActiveTab(store.getState());

      if (!activeTab) {
        return;
      }

      globalAppRegistry.emit('open-import', {
        namespace: activeTab.namespace,
        origin: 'menu',
      });
    }
  );

  return {
    store,
    deactivate() {
      for (const unsub of cleanup) {
        unsub();
      }
      for (const { localAppRegistry } of store.getState().tabs) {
        localAppRegistry.deactivate();
      }
    },
  };
}
