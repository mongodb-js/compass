import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from 'modules';
import { namespaceChanged } from 'modules/namespace';
import { dataServiceConnected } from 'modules/data-service';
import { serverVersionChanged } from 'modules/server-version';
import { editModeChanged } from 'modules/edit-mode';
import { indexesChanged } from 'modules/indexes';
import { queryChanged } from 'modules/query';
import { explainStateChanged } from 'modules/explain';
import {
  localAppRegistryActivated,
  globalAppRegistryActivated
} from 'mongodb-redux-common/app-registry';

import EXPLAIN_STATES from 'constants/explain-states';

export const setDataProvider = (store, error, dataProvider) => {
  store.dispatch(dataServiceConnected(error, dataProvider));
};

/**
 * The store has a combined pipeline reducer plus the thunk middleware.
 *
 * @param {Object} options - Options.
 * @returns {Object} Store.
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
    localAppRegistry.on('indexes-changed', (ixs) => {
      store.dispatch(indexesChanged(ixs));
    });

    /**
     * Refresh on query change.
     */
    localAppRegistry.on('query-changed', (state) => {
      store.dispatch(queryChanged(state));
    });

    localAppRegistry.on('subtab-changed', (name) => {
      if (name === 'Explain Plan') {
        const state = store.getState();

        if (state.query.isChanged === true && state.explain.explainState !== EXPLAIN_STATES.INITIAL) {
          store.dispatch(explainStateChanged(EXPLAIN_STATES.OUTDATED));
        }
      }
    });
  }

  if (options.globalAppRegistry) {
    const globalAppRegistry = options.globalAppRegistry;
    store.dispatch(globalAppRegistryActivated(globalAppRegistry));
  }

  // Set the data provider - this must happen second.
  if (options.dataProvider) {
    setDataProvider(
      store,
      options.dataProvider.error,
      options.dataProvider.dataProvider
    );
  }

  // Set the namespace - must happen third.
  if (options.namespace) {
    store.dispatch(namespaceChanged(options.namespace));
    store.dispatch(explainStateChanged(EXPLAIN_STATES.INITIAL));
  }

  if (options.isReadonly) {
    store.dispatch(editModeChanged(options.isReadonly));
  }

  // Setting server version in fields can change in order but must be after
  // the previous options.
  if (options.serverVersion) {
    store.dispatch(serverVersionChanged(options.serverVersion));
  }

  return store;
};

export default configureStore;
