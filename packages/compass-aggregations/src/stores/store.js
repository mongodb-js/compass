import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from 'modules';
import toNS from 'mongodb-ns';
import { namespaceChanged } from 'modules/namespace';
import { dataServiceConnected } from 'modules/data-service';
import { fieldsChanged } from 'modules/fields';
import { refreshInputDocuments } from 'modules/input-documents';
import { serverVersionChanged } from 'modules/server-version';
import { appRegistryActivated } from 'modules/app-registry';

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
    if (namespace.collection) {
      store.dispatch(namespaceChanged(ns));
      store.dispatch(refreshInputDocuments());
    }
  });

  /**
   * When the collection is changed, update the store.
   */
  appRegistry.on('import-finished', () => {
    store.dispatch(refreshInputDocuments());
  });

  /**
   * Refresh documents on data refresh.
   */
  appRegistry.on('refresh-data', () => {
    const ns = appRegistry.getStore('App.NamespaceStore').ns;
    // TODO: only refresh when we are in the index tab; for now just check if
    // we are in the documents set of tabs.
    if (ns.indexOf('.' === 0)) store.dispatch(refreshInputDocuments());
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
   * When the schema fields change, update the state with the new
   * fields.
   *
   * @param {Object} fields - The fields.
   */
  appRegistry.on('fields-changed', (fields) => {
    store.dispatch(fieldsChanged(fields.aceFields));
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
   * Set the app registry to use later.
   */
  store.dispatch(appRegistryActivated(appRegistry));
};

export default store;
