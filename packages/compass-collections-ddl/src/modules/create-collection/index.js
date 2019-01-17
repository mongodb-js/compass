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
import error, {
  clearError, handleError, INITIAL_STATE as ERROR_INITIAL_STATE
} from 'modules/error';
import { reset, RESET } from 'modules/reset';


/**
 * No dots in DB name error message.
 */
export const NO_DOT = 'Collection names may not contain a "."';

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

    if (dbName.includes('.')) {
      return dispatch(handleError(new Error(NO_DOT)));
    }

    let options = state.isCapped ? { capped: true, size: parseInt(state.cappedSize, 10) } : {};
    options = state.isCustomCollation ? { ...options, coll } : options;
    try {
      dispatch(toggleIsRunning(true));
      ds.createCollection(`${dbName}.${collectionName}`, options, (e) => {
        if (e) {
          return stopWithError(dispatch, e);
        }
        global.hadronApp.appRegistry.getAction('App.InstanceActions').refreshInstance();
        dispatch(reset());
      });
    } catch (e) {
      return stopWithError(dispatch, e);
    }
  };
};
