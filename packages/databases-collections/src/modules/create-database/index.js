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
import error, {
  clearError, handleError, INITIAL_STATE as ERROR_INITIAL_STATE
} from '../error';
import { reset, RESET } from '../reset';
import { prepareMetrics } from '../metrics';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

const { track } = createLoggerAndTelemetry('COMPASS-COLLECTIONS-UI');

/**
 * Open action name.
 */
const OPEN = 'databases-collections/create-database/OPEN';

/**
 * No dots in DB name error message.
 */
export const NO_DOT = 'Database names may not contain a "."';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  isRunning,
  isVisible,
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
  if (action.type === RESET) {
    return {
      ...state,
      isRunning: IS_RUNNING_INITIAL_STATE,
      isVisible: IS_VISIBLE_INITIAL_STATE,
      error: ERROR_INITIAL_STATE
    };
  } else if (action.type === OPEN) {
    return {
      ...state,
      isVisible: true,
      isRunning: IS_RUNNING_INITIAL_STATE,
      error: ERROR_INITIAL_STATE
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
 * Open create database action creator.
 *
 * @returns {Object} The action.
 */
export const open = () => ({
  type: OPEN
});

export const createDatabase = (data) => {
  return (dispatch, getState) => {
    const state = getState();
    const ds = state.dataService.dataService;
    const dbName = data.database;
    const collName = data.collection;

    dispatch(clearError());

    if (dbName.includes('.')) {
      return dispatch(handleError(new Error(NO_DOT)));
    }

    try {
      dispatch(toggleIsRunning(true));
      ds.createCollection(`${dbName}.${collName}`, data.options, (err, collection) => {
        if (err) {
          return stopWithError(dispatch, err);
        }

        const trackEvent = {
          is_capped: !!data.options.capped,
          has_collation: !!data.options.collation,
          is_timeseries: !!data.options.timeseries,
          is_clustered: !!data.options.clusteredIndex,
          expires: !!data.options.expireAfterSeconds
        };
        track('Database Created', trackEvent);

        prepareMetrics(collection).then((metrics) => {
          global.hadronApp.appRegistry.emit('compass:collection:created', metrics);
        });
        global.hadronApp.appRegistry.emit('collection-created', {
          ns: `${dbName}.${collName}`,
          database: dbName,
          collection: collName,
        });
        dispatch(reset());
      });
    } catch (e) {
      return stopWithError(dispatch, e);
    }
  };
};
