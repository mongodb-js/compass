import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from '../modules';
import toNS from 'mongodb-ns';
import { namespaceChanged } from '../modules/namespace';
import { dataServiceConnected } from '../modules/data-service';
import { fieldsChanged } from '../modules/fields';
import { serverVersionChanged } from '../modules/server-version';
import { activateValidation } from '../modules/validation';
import { editModeChanged } from '../modules/edit-mode';
import {
  localAppRegistryActivated,
  globalAppRegistryActivated,
} from '@mongodb-js/mongodb-redux-common/app-registry';
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

    const instanceStore = globalAppRegistry.getStore('App.InstanceStore');
    const { instance } = instanceStore.getState();

    const setEditMode = () => {
      store.dispatch(
        editModeChanged({
          collectionTimeSeries: !!options.isTimeSeries,
          collectionReadOnly: options.isReadonly ? true : false,
          writeStateStoreReadOnly: !instance.isWritable,
          oldServerReadOnly: semver.gte(MIN_VERSION, instance.build.version),
        })
      );
    };

    // set the initial value
    setEditMode();

    // isWritable can change later
    instance.on('change:isWritable', () => {
      store.dispatch(
        editModeChanged({
          writeStateStoreReadOnly: !instance.isWritable,
        })
      );
    });

    store.dispatch(serverVersionChanged(instance.build.version));

    if (options.namespace) {
      const namespace = toNS(options.namespace);
      store.dispatch(namespaceChanged(namespace));
    }

    if (options.dataProvider) {
      setDataProvider(
        store,
        options.dataProvider.error,
        options.dataProvider.dataProvider
      );
    }
  }

  return store;
};

export default configureStore;
