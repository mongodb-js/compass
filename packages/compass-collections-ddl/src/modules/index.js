import { combineReducers } from 'redux';
import appRegistry from 'modules/app-registry';
import dataService from 'modules/data-service';
import columns, {
  INITIAL_STATE as COLUMNS_INITIAL_STATE
} from 'modules/columns';
import collections, {
  INITIAL_STATE as COLLECTIONS_INITIAL_STATE
} from 'modules/collections';
import databases, {
  INITIAL_STATE as DATABASES_INITIAL_STATE
} from 'modules/databases';
import databaseName, {
  INITIAL_STATE as DATABASE_NAME_INITIAL_STATE
} from 'modules/database-name';
import isReadonly, {
  INITIAL_STATE as READONLY_INITIAL_STATE
} from 'modules/is-readonly';
import isWritable, {
  INITIAL_STATE as WRITABLE_INITIAL_STATE
} from 'modules/is-writable';
import sortColumn, {
  INITIAL_STATE as SORT_COLUMN_INITIAL_STATE
} from 'modules/sort-column';
import sortOrder, {
  INITIAL_STATE as SORT_ORDER_INITIAL_STATE
} from 'modules/sort-order';
import { RESET } from 'modules/reset';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  columns,
  collections,
  databases,
  databaseName,
  isReadonly,
  isWritable,
  sortColumn,
  sortOrder,
  appRegistry,
  dataService
});

/**
 * The root reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const rootReducer = (state, action) => {
  if (action.type === RESET) {
    return {
      ...state,
      columns: COLUMNS_INITIAL_STATE,
      collections: COLLECTIONS_INITIAL_STATE,
      databases: DATABASES_INITIAL_STATE,
      databaseName: DATABASE_NAME_INITIAL_STATE,
      isReadonly: READONLY_INITIAL_STATE,
      isWritable: WRITABLE_INITIAL_STATE,
      sortColumn: SORT_COLUMN_INITIAL_STATE,
      sortOrder: SORT_ORDER_INITIAL_STATE
    };
  }
  return reducer(state, action);
};

export default rootReducer;
