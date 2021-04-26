import { parallel } from 'async';
import zipObject from 'lodash.zipobject';
import sortByOrder from 'lodash.sortbyorder';
import { INITIAL_STATE as COLUMNS } from 'modules/columns';

/**
 * Need extra columns to map.
 */
const EXTRA_COLUMNS = COLUMNS.concat([
  '_id',
  'readonly',
  'capped',
  'view_on',
  'type',
  'pipeline'
]);

/**
 * The module prefix.
 */
const PREFIX = 'ddl/collections';

/**
 * The sort collections action name.
 */
export const SORT_COLLECTIONS = `${PREFIX}/SORT_COLLECTIONS`;

/**
 * The load collections action name.
 */
export const LOAD_COLLECTIONS = `${PREFIX}/LOAD_COLLECTIONS`;

/**
 * Default column.
 */
const NAME = 'Collection Name';

/**
 * Default sort.
 */
const ASC = 'asc';

/**
 * The initial state of the collections attribute.
 */
export const INITIAL_STATE = [];

/**
 * Reducer function for handle state changes to collections.
 *
 * @param {Array} state - The collections state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SORT_COLLECTIONS) {
    return sort(action.collections, action.column, action.order);
  } else if (action.type === LOAD_COLLECTIONS) {
    return load(action.collections);
  }
  return state;
}

/**
 * Sort the collection list by column and order.
 *
 * @param {Array} collections - The unsorted collection list.
 * @param {String} column - The column to sort by.
 * @param {String} order - The order to sort by.
 *
 * @returns {Array} The sorted list.
 */
const sort = (collections, column, order) => {
  return sortByOrder(collections, column || NAME, order || ASC);
};

/**
 * Load collections to the UI friendly form.
 *
 * @param {Array} collections - The collections info.
 *
 * @return {Array} The mapped collections for the UI.
 */
export const load = (collections) => {
  return collections.map((coll) => {
    return zipObject(EXTRA_COLUMNS, [
      coll.name,
      coll.document_count,
      coll.size / coll.document_count,
      coll.size,
      coll.index_count,
      coll.index_size,
      coll.collation,
      coll.ns || coll._id,
      coll.readonly,
      coll.is_capped || coll.capped,
      coll.view_on,
      coll.type,
      coll.pipeline
    ]);
  });
};

/**
 * Action creator for load collections events.
 *
 * @param {Array} collections - The raw collection list.
 *
 * @returns {Object} The load collections action.
 */
export const loadCollections = (collections) => ({
  type: LOAD_COLLECTIONS,
  collections: collections
});

/**
 * Action creator for sort collections events.
 *
 * @param {Array} collections - The unsorted collection list.
 * @param {String} column - The column.
 * @param {String} order - The order.
 *
 * @returns {Object} The sort collections action.
 */
export const sortCollections = (collections, column, order) => ({
  type: SORT_COLLECTIONS,
  collections: collections,
  column: column,
  order: order
});

/**
 * Get the stats for each collection in parallel.
 *
 * @param {Array} collections - The collections.
 *
 * @returns {Function} The thunk function.
 */
export const loadCollectionStats = (collections) => {
  return (dispatch, getState) => {
    const state = getState();
    const dataService = state.dataService.dataService;

    if (dataService) {
      parallel(
        collections.map((collection) => {
          return (done) => {
            dataService.collectionStats(
              state.databaseName,
              collection.name,
              (err, res) => {
                collection.set(res);
                done(err, collection);
              }
            );
          };
        }),
        (err, results) => {
          if (err) {
            dispatch(loadCollections(collections));
          } else {
            dispatch(loadCollections(results));
          }
        }
      );
    } else {
      dispatch(loadCollections(collections));
    }
  };
};
