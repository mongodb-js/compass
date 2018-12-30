import { combineReducers } from 'redux';
import dataService from 'modules/data-service';
import isVisible from 'modules/create-database/is-visible';
import name from 'modules/create-database/name';
import collectionName from 'modules/create-database/collection-name';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  isVisible,
  name,
  collectionName,
  dataService
});

export default reducer;
