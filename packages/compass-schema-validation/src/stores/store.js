import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from 'modules';
import toNS from 'mongodb-ns';
import { namespaceChanged } from 'modules/namespace';
import { dataServiceConnected } from 'modules/data-service';
import { fieldsChanged } from 'modules/fields';
import { serverVersionChanged } from 'modules/server-version';
import { fetchValidation, activateValidation } from 'modules/validation';
import { editModeChanged } from 'modules/edit-mode';
import { changeZeroState } from 'modules/zero-state';
import {
  localAppRegistryActivated,
  globalAppRegistryActivated
} from 'mongodb-redux-common/app-registry';
import semver from 'semver';

/**
 * The lowest supported version.
 */
const MIN_VERSION = '3.2.0';

export const setDataProvider = (store, error, dataProvider) => {
  store.dispatch(dataServiceConnected(error, dataProvider));
};

/**
 * The store has a combined pipeline reducer plus the thunk middleware.
 */
const configureStore = (options = {}) => {
  const store = createStore(reducer, applyMiddleware(thunk));

  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;
    store.dispatch(localAppRegistryActivated(localAppRegistry));

    /**
     * When the collection is changed, update the store.
     */
    localAppRegistry.on('fields-changed', (fields) => {
      store.dispatch(fieldsChanged(fields.fields));
    });

    /**
     * Refresh on query change.
     */
    localAppRegistry.on('server-version-changed', (version) => {
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
    localAppRegistry.on('subtab-changed', (tabName) => {
      if (tabName === 'Validation') {
        store.dispatch(activateValidation());
      }
    });
  }

  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;
    store.dispatch(globalAppRegistryActivated(globalAppRegistry));
  }

  if (options.dataProvider) {
    setDataProvider(
      store,
      options.dataProvider.error,
      options.dataProvider.dataProvider
    );
  }

  /**
   * When the collection is changed, update the store.
   *
   * @param {String} ns - The full namespace.
   */
  if (options.namespace) {
    const namespace = toNS(options.namespace);
    const WriteStateStore = options.globalAppRegistry.getStore('DeploymentAwareness.WriteStateStore');
    const editMode = {
      collectionReadOnly: options.isReadonly ? true : false,
      hardonReadOnly: (process.env.HADRON_READONLY === 'true'),
      writeStateStoreReadOnly: !WriteStateStore.state.isWritable
    };

    store.dispatch(namespaceChanged(namespace));

    if (editMode.collectionReadOnly) {
      store.dispatch(changeZeroState(true));
    } else {
      store.dispatch(fetchValidation(namespace));
    }

    store.dispatch(editModeChanged(editMode));
  }

  return store;
};

export default configureStore;
