import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from 'modules';
import toNS from 'mongodb-ns';
import { namespaceChanged } from 'modules/namespace';
import { dataServiceConnected } from 'modules/data-service';
import { fieldsChanged } from 'modules/fields';
import { serverVersionChanged } from 'modules/server-version';
import { appRegistryActivated } from 'modules/app-registry';
import { fetchValidation, activateValidation } from 'modules/validation';
import { editModeChanged } from 'modules/edit-mode';
import { changeZeroState } from 'modules/zero-state';
import semver from 'semver';

/**
 * The lowest supported version.
 */
const MIN_VERSION = '3.2.0';

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
    const WriteStateStore = appRegistry.getStore('DeploymentAwareness.WriteStateStore');
    const editMode = {
      collectionReadOnly: CollectionStore.isReadonly() ? true : false,
      hardonReadOnly: (process.env.HADRON_READONLY === 'true'),
      writeStateStoreReadOnly: !WriteStateStore.state.isWritable
    };

    if (namespace.collection) {
      store.dispatch(namespaceChanged(namespace));

      if (editMode.collectionReadOnly) {
        store.dispatch(changeZeroState(true));
      } else {
        store.dispatch(fetchValidation(namespace));
      }
    }

    store.dispatch(editModeChanged(editMode));
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
  appRegistry.getStore('Field.Store').subscribe(() => {
    const fields = appRegistry.getStore('Field.Store').getState();
    store.dispatch(fieldsChanged(fields.fields));
  });

  /**
   * When the instance is loaded, set our server version.
   *
   * @param {String} version - The version.
   */
  appRegistry.on('server-version-changed', (version) => {
    store.dispatch(serverVersionChanged(version));

    if (version) {
      const editMode = { oldServerReadOnly: semver.gte(MIN_VERSION, version) };

      store.dispatch(editModeChanged(editMode));
    }
  });

  /**
   * When the Schema Validation is an active tab, send 'activated' metric.
   *
   * @param {String} tabName - The name of active tab.
   */
  appRegistry.on('active-tab-changed', (tabName) => {
    if (tabName === 'Validation') {
      store.dispatch(activateValidation());
    }
  });

  /**
   * Set the app registry to use later.
   */
  store.dispatch(appRegistryActivated(appRegistry));
};

export default store;
