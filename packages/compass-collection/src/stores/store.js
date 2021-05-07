import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import toNS from 'mongodb-ns';
import reducer from 'modules';
import { appRegistryActivated } from 'modules/app-registry';
import { dataServiceConnected } from 'modules/data-service';
import { serverVersionChanged } from 'modules/server-version';
import {
  selectOrCreateTab,
  createNewTab,
  clearTabs,
  collectionDropped,
  databaseDropped
} from 'modules/tabs';

const store = createStore(reducer, applyMiddleware(thunk));

/**
 * This hook is Compass specific to listen to app registry events.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
store.onActivated = (appRegistry) => {
  const ipc = require('hadron-ipc');

  /**
   * When a collection namespace is selected in the sidebar.
   *
   * @param {Object} metatada - The metadata.
   */
  appRegistry.on('open-namespace-in-new-tab', (metadata) => {
    if (metadata.namespace) {
      const namespace = toNS(metadata.namespace);
      if (namespace.collection !== '') {
        store.dispatch(
          createNewTab(
            metadata.namespace,
            metadata.isReadonly,
            metadata.sourceName,
            metadata.editViewName,
            metadata.isSourceReadonly,
            metadata.sourceViewOn,
            metadata.sourcePipeline
          )
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
          selectOrCreateTab(
            metadata.namespace,
            metadata.isReadonly,
            metadata.sourceName,
            metadata.editViewName,
            metadata.isSourceReadonly,
            metadata.sourceViewOn,
            metadata.sourcePipeline
          )
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
      const activeTab = state.tabs.find((tab) => (tab.isActive === true));
      if (activeTab.localAppRegistry) {
        activeTab.localAppRegistry.emit('menu-share-schema-json');
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
