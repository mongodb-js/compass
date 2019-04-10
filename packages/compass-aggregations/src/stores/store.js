import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from 'modules';
import toNS from 'mongodb-ns';
import { namespaceChanged } from 'modules/namespace';
import { dataServiceConnected } from 'modules/data-service';
import { fieldsChanged } from 'modules/fields';
import { refreshInputDocuments } from 'modules/input-documents';
import { serverVersionChanged } from 'modules/server-version';
import {
  localAppRegistryActivated,
  globalAppRegistryActivated
} from 'mongodb-redux-common/app-registry';

/**
 * Refresh the input documents.
 *
 * @param {Store} store - The store.
 */
export const refreshInput = (store) => {
  store.dispatch(refreshInputDocuments());
};

/**
 * Set the data provider.
 *
 * @param {Store} store - The store.
 * @param {Error} error - The error (if any) while connecting.
 * @param {Object} provider - The data provider.
 */
export const setDataProvider = (store, error, provider) => {
  store.dispatch(dataServiceConnected(error, provider));
};

/**
 * Set the namespace in the store.
 *
 * @param {Store} store - The store.
 * @param {String} ns - The namespace in "db.collection" format.
 */
export const setNamespace = (store, ns) => {
  const namespace = toNS(ns);
  if (namespace.collection) {
    store.dispatch(namespaceChanged(ns));
    refreshInput(store);
  }
};

/**
 * Set the server version.
 *
 * @param {Store} store - The store.
 * @param {String} version - The version.
 */
export const setServerVersion = (store, version) => {
  store.dispatch(serverVersionChanged(version));
};

/**
 * Set the fields for the autocompleter.
 *
 * @param {Store} store - The store.
 * @param {Array} fields - The fields array in the ACE autocompleter format.
 */
export const setFields = (store, fields) => {
  store.dispatch(fieldsChanged(fields));
};

/**
 * Set the local app registry.
 *
 * @param {Store} store - The store.
 * @param {AppRegistry} appRegistry - The app registry.
 */
export const setLocalAppRegistry = (store, appRegistry) => {
  store.dispatch(localAppRegistryActivated(appRegistry));
};

/**
 * Set the global app registry.
 *
 * @param {Store} store - The store.
 * @param {AppRegistry} appRegistry - The app registry.
 */
export const setGlobalAppRegistry = (store, appRegistry) => {
  store.dispatch(globalAppRegistryActivated(appRegistry));
};

/**
 * One method configure store call.
 *
 * @param {Options} options - The options.
 *
 * @returns {Store} The store.
 */
const configureStore = (options = {}) => {
  const store = createStore(reducer, applyMiddleware(thunk));

  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    setLocalAppRegistry(store, options.localAppRegistry);
  }
  if (options.globalAppRegistry) {
    setGlobalAppRegistry(store, options.globalAppRegistry);
  }

  // Set the data provider - this must happen second.
  if (options.dataProvider) {
    setDataProvider(store, options.dataProvider.error, options.dataProvider.dataProvider);
  }

  // Set the namespace - must happen third.
  if (options.namespace) {
    setNamespace(store, options.namespace);
  }

  // Setting server version in fields can change in order but must be after
  // the previous options.
  if (options.serverVersion) {
    setServerVersion(store, options.serverVersion);
  }
  if (options.fields) {
    setFields(store, options.fields);
  }

  /**
   * This hook is Compass specific to listen to app registry events
   * from the collection scoped app registry.
   *
   * @param {AppRegistry} localAppRegistry - The local app registry.
   * @param {AppRegistry} globalAppRegistry - The global app registry.
   */
  store.onActivated = (localAppRegistry, globalAppRegistry) => {
    /**
     * When the collection is changed, update the store.
     */
    localAppRegistry.on('import-finished', () => {
      refreshInput(store);
    });

    /**
     * Refresh documents on data refresh.
     */
    localAppRegistry.on('refresh-data', () => {
      refreshInput(store);
    });

    /**
     * Refresh documents on global data refresh.
     */
    globalAppRegistry.on('refresh-data', () => {
      refreshInput(store);
    });

    /**
     * When the schema fields change, update the state with the new
     * fields.
     *
     * @param {Object} fields - The fields.
     */
    localAppRegistry.on('fields-changed', (fields) => {
      setFields(store, fields.aceFields);
    });

    /**
     * Set the app registry to use later.
     */
    setLocalAppRegistry(store, localAppRegistry);
    setGlobalAppRegistry(store, globalAppRegistry);
  };

  return store;
};

export default configureStore;
