import { combineReducers } from 'redux';
import dataService from '../data-service';
import serverVersion from '../server-version';
import isRunning, {
  toggleIsRunning,
  INITIAL_STATE as IS_RUNNING_INITIAL_STATE
} from '../is-running';
import isVisible, {
  INITIAL_STATE as IS_VISIBLE_INITIAL_STATE
} from '../is-visible';
import databaseName, {
  INITIAL_STATE as DATABASE_NAME_INITIAL_STATE
} from '../database-name';
import error, {
  clearError, handleError, INITIAL_STATE as ERROR_INITIAL_STATE
} from '../error';
import { reset, RESET } from '../reset';
import { prepareMetrics } from '../metrics';

import createDebug from 'debug';
const debug = createDebug('compass-databases-collections:create-collection');

/**
 * Open action name.
 */
const OPEN = 'databases-collections/create-collection/OPEN';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  isRunning,
  isVisible,
  databaseName,
  error,
  serverVersion,
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
  const resetState = {
    ...state,
    isRunning: IS_RUNNING_INITIAL_STATE,
    isVisible: IS_VISIBLE_INITIAL_STATE,
    databaseName: DATABASE_NAME_INITIAL_STATE,
    error: ERROR_INITIAL_STATE
  };

  if (action.type === RESET) {
    return resetState;
  } else if (action.type === OPEN) {
    return {
      ...resetState,
      isVisible: true,
      databaseName: action.databaseName
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
  debug('create collection failed', err);
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

export const createCollection = (data) => {
  return (dispatch, getState) => {
    const state = getState();
    const ds = state.dataService.dataService;
    const dbName = state.databaseName;
    const namespace = `${dbName}.${data.collection}`;

    dispatch(clearError());

    try {
      dispatch(toggleIsRunning(true));
      ds.createCollection(namespace, data.options, async(err, collection) => {
        if (err) {
          return stopWithError(dispatch, err);
        }
        global.hadronApp.appRegistry.emit('compass:collection:created', await prepareMetrics(collection));
        global.hadronApp.appRegistry.emit('refresh-data');
        dispatch(reset());
      });
    } catch (e) {
      return stopWithError(dispatch, e);
    }
  };
};


