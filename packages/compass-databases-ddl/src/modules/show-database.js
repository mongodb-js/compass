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
  console.log('show database', name);
  return (dispatch, getState) => {
    const appRegistry = getState().appRegistry;
    if (appRegistry) {
      console.log('found app registry');
      const namespaceStore = appRegistry.getStore(NAMESPACE_STORE);
      const collectionStore = appRegistry.getStore(COLLECTION_STORE);
      if (namespaceStore && collectionStore) {
        console.log('found ns & coll stores');
        if (namespaceStore.ns !== name) {
          console.log('ns !== name');
          const ipc = require('hadron-ipc');
          console.log('empty collection');
          collectionStore.setCollection({});
          console.log('set name', name);
          namespaceStore.ns = name;
          console.log('dispatch app registry event');
          dispatch(appRegistryEmit('database-selected', { view: 'table' }));
          console.log('call ipc');
          ipc.call('window:hide-collection-submenu');
        }
      }
    }
  };
};
