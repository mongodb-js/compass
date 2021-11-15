import { zipObject, orderBy } from 'lodash';

import { INITIAL_STATE as COLUMNS } from './columns';
import { UPDATE_SORT } from '../sort';

// The module prefix.
const PREFIX = 'compass-databases-collections/databases';

// The load databases action name.
export const LOAD_DATABASES = `${PREFIX}/LOAD_DATABASES`;

/**
 * Default column.
 */
const NAME = 'Database Name';

/**
 * Default sort.
 */
const ASC = 'asc';

/**
 * The initial state of the databases attribute.
 */
export const INITIAL_STATE = [];

/**
 * Sort the database list by column and order.
 *
 * @param {Array} databases - The unsorted database list.
 * @param {String} column - The column to sort by.
 * @param {String} order - The order to sort by.
 *
 * @returns {Array} The sorted list.
 */
const sort = (databases, column, order) => {
  return orderBy(databases, column || NAME, order || ASC);
};

/**
 * Load databases to the UI friendly form.
 *
 * @param {Array} databases - The databases info.
 *
 * @return {Array} The mapped databases for the UI.
 */
export const load = (databases) => {
  return databases.map((db) => {
    return zipObject(COLUMNS, [
      db._id, db.storage_size, db.collectionsLength ?? 0, db.index_count
    ]);
  });
};

/**
 * Action creator for load databases events.
 *
 * @param {Array} databases - The raw database list.
 *
 * @returns {Object} The load databases action.
 */
export const loadDatabases = (databases) => ({
  type: LOAD_DATABASES,
  databases: databases
});

/**
 * Action creator for sort databases events.
 *
 * @param {Array} databases - The unsorted database list.
 * @param {String} column - The column.
 * @param {String} order - The order.
 *
 * @returns {Object} The sort databases action.
 */
export const sortDatabases = (databases, column, order) => ({
  type: UPDATE_SORT,
  databases: databases,
  column: column,
  order: order
});

/**
 * Reducer function for handle state changes to databases.
 *
 * @param {Array} state - The databases state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === UPDATE_SORT) {
    return sort(action.databases, action.column, action.order);
  } else if (action.type === LOAD_DATABASES) {
    return load(action.databases);
  }
  return state;
}
