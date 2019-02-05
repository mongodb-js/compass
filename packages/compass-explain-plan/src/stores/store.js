import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from 'modules';
import toNS from 'mongodb-ns';
import { namespaceChanged } from 'modules/namespace';
import { dataServiceConnected } from 'modules/data-service';
import { serverVersionChanged } from 'modules/server-version';
import { appRegistryActivated } from 'modules/app-registry';
import { editModeChanged } from 'modules/edit-mode';

/**
 * The store has a combined pipeline reducer plus the thunk middleware.
 */
const store = createStore(reducer, applyMiddleware(thunk));

/**
 * This hook is Compass specific to listen to app registry events.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
store.onActivated = (appRegistry) => {
  /**
   * When the collection is changed, update the store.
   *
   * @param {String} ns - The full namespace.
   */
  appRegistry.on('collection-changed', (ns) => {
    const namespace = toNS(ns);
    const CollectionStore = appRegistry.getStore('App.CollectionStore');
    const isEditable = (
      !CollectionStore.isReadonly() &&
      process.env.HADRON_READONLY !== 'true'
    );

    if (namespace.collection) {
      store.dispatch(namespaceChanged(namespace));
    }

    store.dispatch(editModeChanged(isEditable));
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
   * When the Schema Validation is an active tab, send 'activated' metric.
   *
   * @param {String} tabName - The name of active tab.
   */
  appRegistry.on('active-tab-changed', (tabName) => {
    if (tabName === 'Validation') {
      // TODO: store.dispatch(activateExplainPlan());
    }
  });

  /**
   * Set the app registry to use later.
   */
  store.dispatch(appRegistryActivated(appRegistry));
};

export default store;
