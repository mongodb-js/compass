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
      console.log('-------------------- showCollection dbname', state.databaseName); 
      console.log('-------------------- showCollection name', name); 
      const collectionStore = appRegistry.getStore(COLLECTION_STORE);
      const collection = find(state.collections, (coll) => {
        console.log(coll);
        return coll._id === `${state.databaseName}.${name}`;
      });
      console.log('collection', collection);
      collectionStore.setCollection({
        _id: collection._id,
        readonly: collection.readonly,
        capped: collection.capped
      });
      dispatch(appRegistryEmit('collection-selected', { view: 'table' }));
      const ipc = require('hadron-ipc');
      ipc.call('window:show-collection-submenu');
    }
  };
};
