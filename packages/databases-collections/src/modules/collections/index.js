import { combineReducers } from 'redux';
import appRegistry from '../app-registry';
import dataService from '../data-service';
import columns, {
  INITIAL_STATE as COLUMNS_INITIAL_STATE
} from './columns';
import collections, {
  INITIAL_STATE as COLLECTIONS_INITIAL_STATE
} from './collections';
import databaseName, {
  INITIAL_STATE as DATABASE_NAME_INITIAL_STATE
} from '../database-name';
import isReadonly, {
  INITIAL_STATE as READONLY_INITIAL_STATE
} from '../is-readonly';
import isWritable, {
  INITIAL_STATE as WRITABLE_INITIAL_STATE
} from '../is-writable';
import sortColumn, {
  INITIAL_STATE as SORT_COLUMN_INITIAL_STATE
} from '../sort-column';
import sortOrder, {
  INITIAL_STATE as SORT_ORDER_INITIAL_STATE
} from '../sort-order';
import isDataLake, {
  INITIAL_STATE as DATA_LAKE_INITIAL_STATE
} from '../is-data-lake';
import { RESET } from '../reset';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  columns,
  collections,
  databaseName,
  isReadonly,
  isWritable,
  sortColumn,
  sortOrder,
  appRegistry,
  dataService,
  isDataLake
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
      databaseName: DATABASE_NAME_INITIAL_STATE,
      isReadonly: READONLY_INITIAL_STATE,
      isWritable: WRITABLE_INITIAL_STATE,
      sortColumn: SORT_COLUMN_INITIAL_STATE,
      sortOrder: SORT_ORDER_INITIAL_STATE,
      isDataLake: DATA_LAKE_INITIAL_STATE
    };
  }
  return reducer(state, action);
};

export default rootReducer;
