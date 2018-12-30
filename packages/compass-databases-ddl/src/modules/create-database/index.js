import { combineReducers } from 'redux';
import dataService from 'modules/data-service';
import isVisible from 'modules/create-database/is-visible';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  isVisible,
  dataService
});

export default reducer;
