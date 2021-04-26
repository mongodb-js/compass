import { combineReducers } from 'redux';
import dataService from 'modules/data-service';
import cappedSize, {
  INITIAL_STATE as CAPPED_SIZE_INITIAL_STATE
} from 'modules/create-collection/capped-size';
import isCapped, {
  INITIAL_STATE as IS_CAPPED_INITIAL_STATE
} from 'modules/create-collection/is-capped';
import isCustomCollation, {
  INITIAL_STATE as IS_CUSTOM_COLLATION_INITIAL_STATE
} from 'modules/create-collection/is-custom-collation';
import isRunning, {
  toggleIsRunning,
  INITIAL_STATE as IS_RUNNING_INITIAL_STATE
} from 'modules/is-running';
import isVisible, {
  INITIAL_STATE as IS_VISIBLE_INITIAL_STATE
} from 'modules/is-visible';
import collation, {
  INITIAL_STATE as COLLATION_INITIAL_STATE
} from 'modules/create-collection/collation';
import name, {
  INITIAL_STATE as NAME_INITIAL_STATE
} from 'modules/create-collection/name';
import databaseName, {
  INITIAL_STATE as DATABASE_NAME_INITIAL_STATE
} from 'modules/database-name';
import error, {
  clearError, handleError, INITIAL_STATE as ERROR_INITIAL_STATE
} from 'modules/error';
import { reset, RESET } from 'modules/reset';

/**
 * Open action name.
 */
const OPEN = 'ddl/create-collection/OPEN';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  cappedSize,
  isCapped,
  isCustomCollation,
  isRunning,
  isVisible,
  name,
  databaseName,
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
      isCapped: IS_CAPPED_INITIAL_STATE,
      isCustomCollation: IS_CUSTOM_COLLATION_INITIAL_STATE,
      isRunning: IS_RUNNING_INITIAL_STATE,
      isVisible: IS_VISIBLE_INITIAL_STATE,
      name: NAME_INITIAL_STATE,
      databaseName: DATABASE_NAME_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
      collation: COLLATION_INITIAL_STATE
    };
  } else if (action.type === OPEN) {
    return {
      ...state,
      isVisible: true,
      databaseName: action.databaseName,
      cappedSize: CAPPED_SIZE_INITIAL_STATE,
      isCapped: IS_CAPPED_INITIAL_STATE,
      isCustomCollation: IS_CUSTOM_COLLATION_INITIAL_STATE,
      isRunning: IS_RUNNING_INITIAL_STATE,
      name: NAME_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
      collation: COLLATION_INITIAL_STATE
    };
  }
  return reducer(state, action);
};

export default rootReducer;

/**
 * Stop progress and set the error.
 *
 * @param {Function} dispatch - The dispatch function.
 * @param {Error} err - The error.
 *
 * @return {Object} The result.
 */
const stopWithError = (dispatch, err) => {
  dispatch(toggleIsRunning(false));
  return dispatch(handleError(err));
};

/**
 * Open create collection action creator.
 *
 * @param {String} dbName - The database name.
 *
 * @returns {Object} The action.
 */
export const open = (dbName) => ({
  type: OPEN,
  databaseName: dbName
});

/**
 * The create collection action.
 *
 * @returns {Function} The thunk function.
 */
export const createCollection = () => {
  return (dispatch, getState) => {
    const state = getState();
    const ds = state.dataService.dataService;
    const collectionName = state.name;
    const dbName = state.databaseName;
    const coll = state.collation;

    dispatch(clearError());

    let options = state.isCapped ? { capped: true, size: parseInt(state.cappedSize, 10) } : {};
    options = state.isCustomCollation ? { ...options, collation: coll } : options;
    try {
      dispatch(toggleIsRunning(true));
      ds.createCollection(`${dbName}.${collectionName}`, options, (e) => {
        if (e) {
          return stopWithError(dispatch, e);
        }
        global.hadronApp.appRegistry.emit('refresh-data');
        dispatch(reset());
      });
    } catch (e) {
      return stopWithError(dispatch, e);
    }
  };
};
