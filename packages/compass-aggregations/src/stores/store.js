import { createStore } from 'redux';
import reducer from 'modules';
import { namespaceChanged } from 'modules/namespace';

/**
 * The store has a combined pipeline reducer.
 */
const store = createStore(reducer);

store.onActivated = (appRegistry) => {
  /**
   * When the collection is changed, update the store.
   *
   * @param {String} ns - The full namespace.
   */
  appRegistry.on('collection-changed', (ns) => {
    store.dispatch(namespaceChanged(ns));
  });
};

export default store;
