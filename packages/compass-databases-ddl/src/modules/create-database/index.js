import { combineReducers } from 'redux';
import dataService from 'modules/data-service';
import collectionName from 'modules/create-database/collection-name';
import isCapped from 'modules/create-database/is-capped';
import isVisible from 'modules/create-database/is-visible';
import name from 'modules/create-database/name';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  isCapped,
  isVisible,
  collectionName,
  name,
  dataService
});

export default reducer;
