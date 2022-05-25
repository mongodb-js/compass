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

type RootState = ReturnType<typeof appReducer>;

/**
 * The root reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const rootReducer = (state: any, action: AnyAction): any => {
  const fn = MAPPINGS[action.type];
  return fn ? fn(state, action) : appReducer(state, action);
};

const store: any = createStore(rootReducer, applyMiddleware(thunk));

// We use these symbols so that nothing from outside can access these values on
// the store
const kInstance = Symbol('instance');

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
    if (!store[kInstance]) {
      store[kInstance] = instance;
      instance.on(
        'change:collections.status',
        (collectionModel: Collection, status: string) => {
          const { namespace } = store.getState();
          if (collectionModel.ns === namespace) {
            if (status === 'ready') {
              store.dispatch(updateCollectionDetails(collectionModel));
            }
            if (status === 'error') {
              store.dispatch(resetCollectionDetails());
            }
          }
        }
      );
      instance.dataLake.on(
        'change:isDataLake',
        (_model: unknown, value: boolean) => {
          store.dispatch(dataLakeChanged(value));
        }
      );
      store.dispatch(dataLakeChanged(instance.dataLake.isDataLake));
    }
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
    if (metadata.namespace) {
      store.dispatch(namespaceChanged(metadata.namespace));

      const namespace = toNS(metadata.namespace);
      const { database, collection, ns } = namespace;

      if (database !== '' && collection !== '') {
        const collectionModel =
          store[kInstance].databases.get(database).collections.get(ns) ?? null;
        store.dispatch(updateCollectionDetails(collectionModel));
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
      }
    }
  });

  /**
   * When a collection namespace is selected in the sidebar.
   *
   * @param {Object} metatada - The metadata.
   */
  appRegistry.on('select-namespace', (metadata) => {
    if (metadata.namespace) {
      store.dispatch(namespaceChanged(metadata.namespace));

      const namespace = toNS(metadata.namespace);
      const { database, collection, ns } = namespace;

      if (database !== '' && collection !== '') {
        const collectionModel =
          store[kInstance].databases.get(database).collections.get(ns) ?? null;
        store.dispatch(updateCollectionDetails(collectionModel));
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
      }
    }
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
  appRegistry.on('collection-dropped', (namespace) => {
    store.dispatch(collectionDropped(namespace));
  });

  /**
   * Remove any open tabs when database dropped.
   *
   * @param {String} name - The name.
   */
  appRegistry.on('database-dropped', (name) => {
    store.dispatch(databaseDropped(name));
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
   * When the instance is loaded, set our server version.
   *
   * @param {String} version - The version.
   */
  appRegistry.on('server-version-changed', (version) => {
    store.dispatch(serverVersionChanged(version));
  });

  /**
   * When we disconnect from the instance, clear all the tabs.
   */
  appRegistry.on('data-service-disconnected', () => {
    store.dispatch(clearTabs());
  });

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
    if (state.tabs) {
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

  /**
   * Set the app registry to use later.
   */
  store.dispatch(appRegistryActivated(appRegistry));
};

export default store;
