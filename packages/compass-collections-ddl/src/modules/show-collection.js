import find from 'lodash.find';
import toNS from 'mongodb-ns';
import { appRegistryEmit } from 'modules/app-registry';

/**
 * Get the source of a collection from a list of collections.
 *
 * @param {Object} collection - The collection.
 * @param {Array} collections - The database's collections.
 *
 * @returns {Object} The source or null.
 */
const getSource = (collection, collections) => {
  if (!collection.view_on) return null;
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

      dispatch(appRegistryEmit(
        'select-namespace',
        {
          namespace: collection._id,
          isReadonly: collection.readonly,
          sourceName: collection.view_on ? `${state.databaseName}.${collection.view_on}` : null,
          editViewName: null,
          isSourceReadonly: source ? source.readonly : false,
          sourceViewOn: source ? `${state.databaseName}.${source.view_on}` : null,
          sourcePipeline: collection.pipeline || null
        }
      ));

      dispatch(appRegistryEmit('collection-selected', { view: 'table' }));

      if (!state.isDataLake) {
        const ipc = require('hadron-ipc');
        ipc.call('window:show-collection-submenu');
      }
    }
  };
};
