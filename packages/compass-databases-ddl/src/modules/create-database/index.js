import { combineReducers } from 'redux';
import dataService from 'modules/data-service';
import cappedSize from 'modules/create-database/capped-size';
import collectionName from 'modules/create-database/collection-name';
import isCapped from 'modules/create-database/is-capped';
import isCustomCollation from 'modules/create-database/is-custom-collation';
import isVisible from 'modules/create-database/is-visible';
import collation from 'modules/create-database/collation';
import name from 'modules/create-database/name';
import error, { handleError } from 'modules/create-database/error';

/**
 * No dots in DB name error message.
 */
export const NO_DOT = 'Database names may not contain a "."';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  cappedSize,
  collectionName,
  isCapped,
  isCustomCollation,
  isVisible,
  name,
  error,
  collation,
  dataService
});

export default reducer;

/**
 * The create database action.
 *
 * @returns {Function} The thunk function.
 */
export const createDatabase = () => {
  return (dispatch, getState) => {
    const state = getState();
    const ds = state.dataService.dataService;
    const dbName = state.name;
    const coll = state.collation;

    if (dbName.includes('.')) {
      return dispatch(handleError(new Error(NO_DOT)));
    }

    let options = state.isCapped ? { capped: true, size: parseInt(state.cappedSize, 10) } : {};
    options = state.isCustomCollation ? { ...options, coll } : options;
    try {
      ds.createCollection(`${dbName}.${state.collectionName}`, options, (e) => {
        if (e) {
          return dispatch(handleError(e));
        }
        global.hadronApp.appRegistry.getAction('App.InstanceActions').refreshInstance();
      });
    } catch (e) {
      return dispatch(handleError(e));
    }
  };
};
