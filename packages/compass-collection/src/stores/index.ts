import { createStore, applyMiddleware } from 'redux';
import type AppRegistry from 'hadron-app-registry';
import thunk from 'redux-thunk';
import toNS from 'mongodb-ns';
import { appRegistryActivated } from './app-registry';
import { dataServiceConnected } from './data-service';
import { serverVersionChanged } from './server-version';
import {
  selectOrCreateTab,
  createNewTab,
  clearTabs,
  collectionDropped,
  databaseDropped,
} from './tabs';

import { combineReducers } from 'redux';
import appRegistry, {
  INITIAL_STATE as APP_REGISTRY_INITIAL_STATE,
} from './app-registry';
import dataService, {
  INITIAL_STATE as DATA_SERVICE_INITIAL_STATE,
} from './data-service';
import serverVersion, {
  INITIAL_STATE as SERVER_VERSION_INITIAL_STATE,
} from './server-version';
import isDataLake, {
  INITIAL_STATE as IS_DATA_LAKE_INITIAL_STATE,
} from './is-data-lake';
import tabs, { INITIAL_STATE as TABS_INITIAL_STATE } from './tabs';
import type { WorkspaceTabObject } from './tabs';

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
};

/**
 * Handle the reset.
 *
 * @returns {Object} The new state.
 */
const doReset = () => ({
  ...INITIAL_STATE,
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
});

/**
 * The root reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const rootReducer = (state: any, action: any) => {
  const fn = MAPPINGS[action.type];
  return fn ? fn(state, action) : appReducer(state, action);
};

const store: any = createStore(rootReducer, applyMiddleware(thunk));

/**
 * This hook is Compass specific to listen to app registry events.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
store.onActivated = (appRegistry: AppRegistry) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ipc = require('hadron-ipc');

  /**
   * When a collection namespace is selected in the sidebar.
   *
   * @param {Object} metadata - The metadata.
   */
  appRegistry.on('open-namespace-in-new-tab', (metadata) => {
    if (metadata.namespace) {
      const namespace = toNS(metadata.namespace);
      if (namespace.collection !== '') {
        store.dispatch(
          createNewTab({
            namespace: metadata.namespace,
            isReadonly: metadata.isReadonly,
            sourceName: metadata.sourceName,
            editViewName: metadata.editViewName,
            sourceReadonly: metadata.sourceReadonly,
            isTimeSeries: !!metadata.isTimeSeries,
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
      const namespace = toNS(metadata.namespace);
      if (namespace.collection !== '') {
        store.dispatch(
          selectOrCreateTab({
            namespace: metadata.namespace,
            isReadonly: metadata.isReadonly,
            isTimeSeries: metadata.isTimeSeries,
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
   *
   * @param {Error} error - The error.
   * @param {DataService} dataService - The data service.
   */
  appRegistry.on('data-service-connected', (error, dataService) => {
    store.dispatch(dataServiceConnected(error, dataService));
  });

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

store.subscribe(() => {
  const state = store.getState();
  if (state.tabs.length === 0) {
    if (state.appRegistry) {
      state.appRegistry.emit('all-collection-tabs-closed');
    }
  }
});

export default store;
