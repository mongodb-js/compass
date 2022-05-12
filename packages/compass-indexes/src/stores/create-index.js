import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from '../modules/create-index';
import { dataServiceConnected } from '../modules/data-service';
import {
  localAppRegistryActivated,
  globalAppRegistryActivated,
} from '@mongodb-js/mongodb-redux-common/app-registry';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { changeSchemaFields } from '../modules/create-index/schema-fields';
import { parseErrorMsg } from '../modules/indexes';
import { handleError } from '../modules/error';
import { toggleIsVisible } from '../modules/is-visible';
import { namespaceChanged } from '../modules/namespace';
import { serverVersionChanged } from '../modules/server-version';

const { track } = createLoggerAndTelemetry('COMPASS-INDEXES-UI');

/**
 * Handle setting up the data provider.
 *
 * @param {Object} store - The store.
 * @param {Object} error - The error.
 * @param {Object} provider - The provider.
 */
export const setDataProvider = (store, error, provider) => {
  if (error !== null) {
    store.dispatch(handleError(parseErrorMsg(error)));
  } else {
    store.dispatch(dataServiceConnected(provider));
  }
};

const configureStore = (options = {}) => {
  const store = createStore(reducer, applyMiddleware(thunk));

  // Set the app registry if preset. This must happen first.
  if (options.localAppRegistry) {
    const localAppRegistry = options.localAppRegistry;
    store.dispatch(localAppRegistryActivated(localAppRegistry));

    localAppRegistry.on('fields-changed', (state) => {
      store.dispatch(
        changeSchemaFields(
          Object.keys(state.fields).filter((name) => name !== '_id')
        )
      );
    });

    localAppRegistry.on('toggle-create-index-modal', (isVisible) => {
      track('Index Create Opened');
      store.dispatch(toggleIsVisible(isVisible));
    });

    localAppRegistry.on('data-service-connected', (error, ds) => {
      setDataProvider(store, error, ds);
    });
  }

  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;
    store.dispatch(globalAppRegistryActivated(globalAppRegistry));
  }

  if (options.namespace) {
    store.dispatch(namespaceChanged(options.namespace));
  }

  if (options.serverVersion) {
    store.dispatch(serverVersionChanged(options.serverVersion));
  }

  // Set the data provider - this must happen second.
  if (options.dataProvider) {
    setDataProvider(
      store,
      options.dataProvider.error,
      options.dataProvider.dataProvider
    );
  }

  return store;
};

export default configureStore;
