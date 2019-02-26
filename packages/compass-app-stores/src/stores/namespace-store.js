import { createStore } from 'redux';
import reducer from 'modules/namespace';
import toNS from 'mongodb-ns';

import { reset } from 'modules/namespace/reset';
import { changeNamespace } from 'modules/namespace/ns';


const store = createStore(reducer);

store.onActivated = (appRegistry) => {
  // Events emitted from the app registry:
  appRegistry.on('data-service-disconnected', () => {
    store.dispatch(reset());
  });
};

Object.defineProperty(store, 'ns', {
  /**
   * Gets the current namespace being worked with in the application.
   *
   * @returns {String} the current ns.
   */
  get: () => (store.getState().ns),
  /**
   * Set the current namespace being worked on in the application.
   *
   * @param {String} ns - The current ns.
   */
  set: (ns) => {
    const registry = global.hadronApp.appRegistry;
    if (registry) {
      const oldNs = toNS(store.getState().ns);
      const newNs = toNS(ns);

      if (oldNs.database !== newNs.database) {
        registry.emit('database-changed', ns);
      }
      if (oldNs.database !== newNs.database || oldNs.collection !== newNs.collection) {
        registry.emit('collection-changed', ns);
      }
    }
    store.dispatch(changeNamespace(ns));
  }
});

export default store;
