import type AppRegistry from 'hadron-app-registry';
import type Collection from 'mongodb-collection-model';
import { combineReducers } from 'redux';
import { createStore, applyMiddleware } from 'redux';
import type { AnyAction } from 'redux';
import thunk from 'redux-thunk';
import toNS from 'mongodb-ns';
import type { DataService } from 'mongodb-data-service';

import appRegistry, {
  appRegistryActivated,
  INITIAL_STATE as APP_REGISTRY_INITIAL_STATE,
} from '../modules/app-registry';
import dataService, {
  dataServiceConnected,
  INITIAL_STATE as DATA_SERVICE_INITIAL_STATE,
} from '../modules/data-service';
import serverVersion, {
  serverVersionChanged,
  INITIAL_STATE as SERVER_VERSION_INITIAL_STATE,
} from '../modules/server-version';
import isDataLake, {
  dataLakeChanged,
  INITIAL_STATE as IS_DATA_LAKE_INITIAL_STATE,
} from '../modules/is-data-lake';
import stats, {
  updateCollectionDetails,
  resetCollectionDetails,
  getInitialState as getInitialStatsState,
} from '../modules/stats';
import tabs, {
  selectOrCreateTab,
  createNewTab,
  clearTabs,
  collectionDropped,
  databaseDropped,
  INITIAL_STATE as TABS_INITIAL_STATE,
} from '../modules/tabs';
import namespace, {
  namespaceChanged,
  INITIAL_STATE as NS_INITIAL_STATE,
} from '../modules/namespace';
import type { WorkspaceTabObject } from '../modules/tabs';

/**
 * Reset action constant.
 */
export const RESET = 'collection/reset';

/**
 * Reset the entire state.
 *
 * @returns {Object} The action.
 */
export const reset = (): { type: string } => ({
  type: RESET,
});

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  appRegistry: APP_REGISTRY_INITIAL_STATE,
  dataService: DATA_SERVICE_INITIAL_STATE,
  serverVersion: SERVER_VERSION_INITIAL_STATE,
  tabs: TABS_INITIAL_STATE,
  isDataLake: IS_DATA_LAKE_INITIAL_STATE,
  stats: getInitialStatsState(),
  namespace: NS_INITIAL_STATE,
};

/**
 * Handle the reset.
 */
const doReset = ({ appRegistry }: RootState) => ({
  ...INITIAL_STATE,
  appRegistry,
});

/**
 * The action to state modifier mappings.
 */
const MAPPINGS: any = {
  [RESET]: doReset,
};

const appReducer = combineReducers({
  appRegistry,
  dataService,
  serverVersion,
  tabs,
  isDataLake,
  stats,
  namespace,
});

export type RootState = ReturnType<typeof appReducer>;

/**
 * The root reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const rootReducer = (state: any, action: AnyAction) => {
  const fn = MAPPINGS[action.type];
  return fn ? fn(state, action) : appReducer(state, action);
};

const store: any = createStore(rootReducer, applyMiddleware(thunk));

// We use these symbols so that nothing from outside can access these values on
// the store. Exported for tests.
export const kInstance = Symbol('instance');

/**
 * This hook is Compass specific to listen to app registry events.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
store.onActivated = (appRegistry: AppRegistry) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ipc = require('hadron-ipc');

  /**
   * When instance is created.
   */
  appRegistry.on('instance-created', ({ instance }) => {
    if (store[kInstance]) {
      // we should probably throw in this case
      return;
    }

    store[kInstance] = instance;

    instance.on(
      'change:collections.status',
      (collectionModel: Collection, status: string) => {
        if (status === 'ready') {
          store.dispatch(
            updateCollectionDetails(collectionModel, collectionModel.ns)
          );
        }
        if (status === 'error') {
          store.dispatch(resetCollectionDetails(collectionModel.ns));
        }
      }
    );

    instance.dataLake.on(
      'change:isDataLake',
      (_model: unknown, value: boolean) => {
        store.dispatch(dataLakeChanged(value));
      }
    );
    // TODO: is it even possible that instance.dataLake.isDataLake already makes sense before the event arrives?
    store.dispatch(dataLakeChanged(instance.dataLake.isDataLake));

    instance.build.on('change:version', (_model: unknown, value: string) => {
      store.dispatch(serverVersionChanged(value));
    });
  });

  /**
   * When instance is destroyed.
   */
  appRegistry.on('instance-destroyed', () => {
    store[kInstance] = null;
    store.dispatch(reset());
  });

  /**
   * When a collection namespace is opened in a new tab.
   *
   * @param {Object} metadata - The metadata.
   */
  appRegistry.on('open-namespace-in-new-tab', (metadata) => {
    if (!metadata.namespace) {
      return;
    }

    store.dispatch(namespaceChanged(metadata.namespace));

    const namespace = toNS(metadata.namespace);
    const { database, collection, ns } = namespace;

    if (database === '' || collection === '') {
      return;
    }

    const collectionModel =
      store[kInstance].databases.get(database).collections.get(ns) ?? null;

    if (!collectionModel) {
      return;
    }

    store.dispatch(updateCollectionDetails(collectionModel as Collection, ns));

    store.dispatch(
      createNewTab({
        namespace: metadata.namespace,
        isReadonly: metadata.isReadonly,
        sourceName: metadata.sourceName,
        editViewName: metadata.editViewName,
        sourceReadonly: metadata.sourceReadonly,
        isTimeSeries: !!metadata.isTimeSeries,
        isClustered: !!metadata.isClustered,
        isFLE: !!metadata.isFLE,
        sourceViewOn: metadata.sourceViewOn,
        sourcePipeline: metadata.sourcePipeline,
        query: metadata.query,
        aggregation: metadata.aggregation,
      })
    );
  });

  /**
   * When a collection namespace is selected in the sidebar.
   *
   * @param {Object} metatada - The metadata.
   */
  appRegistry.on('select-namespace', (metadata) => {
    if (!metadata.namespace) {
      return;
    }

    store.dispatch(namespaceChanged(metadata.namespace));

    const namespace = toNS(metadata.namespace);
    const { database, collection, ns } = namespace;

    if (database === '' || collection === '') {
      return;
    }

    const collectionModel =
      store[kInstance].databases.get(database).collections.get(ns) ?? null;

    if (!collectionModel) {
      return;
    }

    store.dispatch(updateCollectionDetails(collectionModel as Collection, ns));

    store.dispatch(
      selectOrCreateTab({
        namespace: metadata.namespace,
        isReadonly: metadata.isReadonly,
        isTimeSeries: metadata.isTimeSeries,
        isClustered: metadata.isClustered,
        isFLE: metadata.isFLE,
        sourceName: metadata.sourceName,
        editViewName: metadata.editViewName,
        sourceReadonly: metadata.sourceReadonly,
        sourceViewOn: metadata.sourceViewOn,
        sourcePipeline: metadata.sourcePipeline,
      })
    );
  });

  /**
   * Clear the tabs when selecting a database.
   */
  appRegistry.on('database-selected', () => {
    store.dispatch(clearTabs());
  });

  /**
   * Remove any open tabs when collection dropped.
   *
   * @param {String} namespace - The namespace.
   */
  appRegistry.on('collection-dropped', (namespace: string) => {
    store.dispatch(collectionDropped(namespace));

    const currentNamespace = store.getState().namespace;
    if (namespace === currentNamespace) {
      appRegistry.emit('active-collection-dropped', namespace);
    }
  });

  /**
   * Remove any open tabs when database dropped.
   *
   * @param {String} name - The name.
   */
  appRegistry.on('database-dropped', (name: string) => {
    store.dispatch(databaseDropped(name));

    const currentNamespace = store.getState().namespace;
    if (currentNamespace) {
      const { database } = toNS(currentNamespace as string);
      if (name === database) {
        appRegistry.emit('active-database-dropped', name);
      }
    }
  });

  /**
   * Set the data service in the store when connected.
   */
  appRegistry.on(
    'data-service-connected',
    (error, dataService: DataService) => {
      store.dispatch(dataServiceConnected(error, dataService));
    }
  );

  /**
   * When we disconnect from the instance, clear all the tabs.
   */
  appRegistry.on('data-service-disconnected', () => {
    store.dispatch(clearTabs());
  });

  // TODO: importing hadron-ipc in unit tests doesn't work right now
  if (ipc.on) {
    /**
     * When `Share Schema as JSON` clicked in menu send event to the active tab.
     */
    ipc.on('window:menu-share-schema-json', () => {
      const state = store.getState();
      if (state.tabs) {
        const activeTab = state.tabs.find(
          (tab: WorkspaceTabObject) => tab.isActive === true
        );
        if (activeTab.localAppRegistry) {
          activeTab.localAppRegistry.emit('menu-share-schema-json');
        }
      }
    });

    ipc.on('compass:open-export', () => {
      const state = store.getState();
      if (!state.tabs) {
        return;
      }
      const activeTab = state.tabs.find(
        (tab: WorkspaceTabObject) => tab.isActive === true
      );
      if (activeTab) {
        const crudStore = activeTab.localAppRegistry.getStore('CRUD.Store');
        const { query: crudQuery, count } = crudStore.state;
        const { filter, limit, skip } = crudQuery;
        appRegistry.emit('open-export', {
          namespace: activeTab.namespace,
          query: { filter, limit, skip },
          count,
        });
      }
    });

    ipc.on('compass:open-import', () => {
      const state = store.getState();
      if (state.tabs) {
        const activeTab = state.tabs.find(
          (tab: WorkspaceTabObject) => tab.isActive === true
        );
        if (activeTab) {
          appRegistry.emit('open-import', { namespace: activeTab.namespace });
        }
      }
    });
  }

  /**
   * Set the app registry to use later.
   */
  store.dispatch(appRegistryActivated(appRegistry));
};

export default store;
