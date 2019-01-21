import find from 'lodash.find';
import { appRegistryEmit } from 'modules/app-registry';

/**
 * Collection store name in the app registry.
 */
const COLLECTION_STORE = 'App.CollectionStore';

/**
 * Show the collection.
 *
 * @param {String} name - The collection name.
 */
export const showCollection = (name) => {
  return (dispatch, getState) => {
    const state = getState();
    const appRegistry = state.appRegistry;
    if (appRegistry) {
      const collectionStore = appRegistry.getStore(COLLECTION_STORE);
      console.log('------------------- find collection', state.collections);
      console.log('------------------- state', state);
      console.log('------------------- name', name);
      const collection = find(state.collections, (coll) => {
        return coll._id === `${state.databaseName}.${name}`;
      });
      collectionStore.setCollection(collection);
      dispatch(appRegistryEmit('collection-selected', { view: 'table' }));
      const ipc = require('hadron-ipc');
      ipc.call('window:show-collection-submenu');
    }
  };
};
