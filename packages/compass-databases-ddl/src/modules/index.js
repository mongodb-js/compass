import { combineReducers } from 'redux';
import columns from 'modules/columns';
import databases from 'modules/databases';
import dataService from 'modules/data-service';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  columns,
  databases,
  dataService
});

export default reducer;
