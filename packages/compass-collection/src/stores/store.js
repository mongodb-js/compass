import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import toNS from 'mongodb-ns';
import reducer from 'modules';
import { appRegistryActivated } from 'modules/app-registry';
import { dataServiceConnected } from 'modules/data-service';
import { serverVersionChanged } from 'modules/server-version';
import { selectNamespace, preCreateTab } from 'modules/tabs';

const store = createStore(reducer, applyMiddleware(thunk));

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
  appRegistry.on('open-namespace-in-new-tab', (ns, isReadonly, sourceName) => {
    if (ns) {
      const namespace = toNS(ns);
      if (namespace.collection) {
        store.dispatch(preCreateTab(ns, isReadonly, sourceName));
      }
    }
  });

  /**
   * When a collection namespace is selected in the sidebar.
   *
   * @param {String} ns - The namespace.
   */
  appRegistry.on('select-namespace', (ns, isReadonly, sourceName) => {
    if (ns) {
      const namespace = toNS(ns);
      if (namespace.collection) {
        store.dispatch(selectNamespace(ns, isReadonly, sourceName));
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
