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
      const collection = find(state.collections, (coll) => {
        return coll._id === `${state.databaseName}.${name}`;
      });
      collectionStore.setCollection({
        _id: collection._id,
        readonly: collection.readonly,
        capped: collection.capped
      });
      dispatch(appRegistryEmit('collection-selected', { view: 'table' }));
      if (!state.isDataLake) {
        const ipc = require('hadron-ipc');
        ipc.call('window:show-collection-submenu');
      }
    }
  };
};
