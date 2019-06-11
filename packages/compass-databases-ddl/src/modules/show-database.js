import { appRegistryEmit } from 'modules/app-registry';

/**
 * Namespace store name in the app registry.
 */
const NAMESPACE_STORE = 'App.NamespaceStore';

/**
 * Collection store name in the app registry.
 */
const COLLECTION_STORE = 'App.CollectionStore';

/**
 * Show the database.
 *
 * @param {String} name - The database name.
 */
export const showDatabase = (name) => {
  return (dispatch, getState) => {
    const appRegistry = getState().appRegistry;
    if (appRegistry) {
      const namespaceStore = appRegistry.getStore(NAMESPACE_STORE);
      const collectionStore = appRegistry.getStore(COLLECTION_STORE);
      if (namespaceStore.ns !== name) {
        const ipc = require('hadron-ipc');
        collectionStore.setCollection({});
        namespaceStore.ns = name;
        dispatch(appRegistryEmit('select-database', name));
        dispatch(appRegistryEmit('database-selected', { view: 'table' }));
        ipc.call('window:hide-collection-submenu');
      }
    }
  };
};
