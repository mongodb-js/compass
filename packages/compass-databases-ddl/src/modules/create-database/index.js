import { combineReducers } from 'redux';
import dataService from 'modules/data-service';
import cappedSize, {
  INITIAL_STATE as CAPPED_SIZE_INITIAL_STATE
} from 'modules/create-database/capped-size';
import collectionName, {
  INITIAL_STATE as COLLECTION_NAME_INITIAL_STATE
} from 'modules/create-database/collection-name';
import isCapped, {
  INITIAL_STATE as IS_CAPPED_INITIAL_STATE
} from 'modules/create-database/is-capped';
import isCustomCollation, {
  INITIAL_STATE as IS_CUSTOM_COLLATION_INITIAL_STATE
} from 'modules/create-database/is-custom-collation';
import isRunning, {
  toggleIsRunning,
  INITIAL_STATE as IS_RUNNING_INITIAL_STATE
} from 'modules/create-database/is-running';
import isVisible, {
  INITIAL_STATE as IS_VISIBLE_INITIAL_STATE
} from 'modules/create-database/is-visible';
import collation, {
  INITIAL_STATE as COLLATION_INITIAL_STATE
} from 'modules/create-database/collation';
import name, {
  INITIAL_STATE as NAME_INITIAL_STATE
} from 'modules/create-database/name';
import error, {
  clearError, handleError, INITIAL_STATE as ERROR_INITIAL_STATE
} from 'modules/create-database/error';

/**
 * No dots in DB name error message.
 */
export const NO_DOT = 'Database names may not contain a "."';

/**
 * The reset action name.
 */
export const RESET = 'ddl/create-database/RESET';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  cappedSize,
  collectionName,
  isCapped,
  isCustomCollation,
  isRunning,
  isVisible,
  name,
  error,
  collation,
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
      cappedSize: CAPPED_SIZE_INITIAL_STATE,
      collectionName: COLLECTION_NAME_INITIAL_STATE,
      isCapped: IS_CAPPED_INITIAL_STATE,
      isCustomCollation: IS_CUSTOM_COLLATION_INITIAL_STATE,
      isRunning: IS_RUNNING_INITIAL_STATE,
      isVisible: IS_VISIBLE_INITIAL_STATE,
      name: NAME_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
      collation: COLLATION_INITIAL_STATE
    };
  }
  return reducer(state, action);
};

export default rootReducer;

/**
 * Reset the state of the entire store.
 *
 * @return {Object} The action creator.
 */
export const reset = () => ({
  type: RESET
});

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

    dispatch(clearError());

    if (dbName.includes('.')) {
      return dispatch(handleError(new Error(NO_DOT)));
    }

    let options = state.isCapped ? { capped: true, size: parseInt(state.cappedSize, 10) } : {};
    options = state.isCustomCollation ? { ...options, coll } : options;
    try {
      dispatch(toggleIsRunning(true));
      ds.createCollection(`${dbName}.${state.collectionName}`, options, (e) => {
        if (e) {
          return dispatch(handleError(e));
        }
        global.hadronApp.appRegistry.getAction('App.InstanceActions').refreshInstance();
        dispatch(reset());
      });
    } catch (e) {
      return dispatch(handleError(e));
    }
  };
};
