import { combineReducers } from 'redux';
import columns from 'modules/columns';
import databases from 'modules/databases';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  columns,
  databases
});

export default reducer;
