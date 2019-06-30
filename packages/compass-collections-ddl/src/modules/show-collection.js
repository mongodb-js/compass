import find from 'lodash.find';
import toNS from 'mongodb-ns';
import { appRegistryEmit } from 'modules/app-registry';

/**
 * Get the source of a collection from a list of collections.
 *
 * @param {Object} collection - The collection.
 * @param {Array} collection - The database's collections.
 *
 * @returns {Object} The source or null.
 */
const getSource = (collection, collections) => {
  if (!collection.readonly) return null;
  return collections.find((coll) => {
    return toNS(coll._id).collection === collection.view_on;
  });
};

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
      // Get the collection to select.
      const collection = find(state.collections, (coll) => {
        return coll._id === `${state.databaseName}.${name}`;
      });
      // Get the source of the view, if a view.
      const source = getSource(collection, state.collections);

      console.log('collection', collection);
      console.log('source', source);
      console.log(
        'emitting select-namespace',
        collection._id,
        collection.readonly,
        `${state.databaseName}.${collection.view_on}`,
        null,
        source ? source.readonly : false,
        source ? `${state.databaseName}.${source.view_on}` : null,
        collection.pipeline
      );

      appRegistryEmit(
        'select-namespace',
        collection._id,
        collection.readonly,
        `${state.databaseName}.${collection.view_on}`,
        null,
        source ? source.readonly : false,
        source ? `${state.databaseName}.${source.view_on}` : null,
        collection.pipeline
      );

      dispatch(appRegistryEmit('collection-selected', { view: 'table' }));

      if (!state.isDataLake) {
        const ipc = require('hadron-ipc');
        ipc.call('window:show-collection-submenu');
      }
    }
  };
};
