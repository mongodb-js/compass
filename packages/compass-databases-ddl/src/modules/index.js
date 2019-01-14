import { combineReducers } from 'redux';
import appRegistry from 'modules/app-registry';
import columns from 'modules/columns';
import databases from 'modules/databases';
import dataService from 'modules/data-service';
import isReadonly from 'modules/is-readonly';
import isWritable from 'modules/is-writable';
import sortColumn from 'modules/sort-column';
import sortOrder from 'modules/sort-order';
import createDatabase from 'modules/create-database';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  columns,
  databases,
  isReadonly,
  isWritable,
  sortColumn,
  sortOrder,
  createDatabase,
  dataService,
  appRegistry
});

export default reducer;
