import zipObject from 'lodash.zipobject';
import sortByOrder from 'lodash.sortbyorder';
import { INITIAL_STATE as COLUMNS } from 'modules/columns';

/**
 * The sort databases action name.
 */
export const SORT_DATABASES = 'ddl/databases/SORT_DATABASES';

/**
 * The initial state of the databases attribute.
 */
const INITIAL_STATE = null;

/**
 * Reducer function for handle state changes to databases.
 *
 * @param {Array} state - The databases state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SORT_DATABASES) {
    return sort(state, action.column, action.order);
  }
  return state;
}

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
  // datbases: [{ _id: '', index_count: 1, storage_size: 1, collections: [] }]
  // column: 'Database Name'
  // order: 'asc'
  const unsorted = databases.map((db) => {
    return zipObject(COLUMNS, [
      db._id, db.storage_size, db.collections.length, db.index_count
    ]);
  });
  return sortByOrder(unsorted, column, order);
};

/**
 * Action creator for sort databases events.
 *
 * @param {String} column - The column.
 * @param {String} order - The order.
 *
 * @returns {Object} The sort databases action.
 */
export const sortDatabases = (column, order) => ({
  type: SORT_DATABASES,
  column: column,
  order: order
});
