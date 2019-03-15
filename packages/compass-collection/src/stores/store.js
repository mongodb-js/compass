import { createStore } from 'redux';
import toNS from 'mongodb-ns';
import reducer from 'modules';
import { appRegistryActivated } from 'modules/app-registry';
import { dataServiceConnected } from 'modules/data-service';
import { serverVersionChanged } from 'modules/server-version';
import { selectNamespace } from 'modules/tabs';

const store = createStore(reducer);

/**
 * This hook is Compass specific to listen to app registry events.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 */
store.onActivated = (appRegistry) => {
  /**
   * When a collection namespace is selected in the sidebar.
   *
   * @param {String} ns - The namespace.
   */
  appRegistry.on('select-namespace', (ns) => {
    if (ns) {
      const namespace = toNS(ns);
      if (namespace.collection) {
        store.dispatch(selectNamespace(ns));
      }
    }
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
   * Set the app registry to use later.
   */
  store.dispatch(appRegistryActivated(appRegistry));
};

export default store;
