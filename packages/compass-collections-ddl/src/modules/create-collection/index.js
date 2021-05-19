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
import isTimeSeries, {
  INITIAL_STATE as IS_TIME_SERIES_INITIAL_STATE
} from 'modules/create-collection/is-time-series';
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
import timeSeries, {
  INITIAL_STATE as TIME_SERIES_INITIAL_STATE
} from 'modules/create-collection/time-series';
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
  isTimeSeries,
  name,
  databaseName,
  error,
  collation,
  timeSeries,
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
    cappedSize: CAPPED_SIZE_INITIAL_STATE,
    isCapped: IS_CAPPED_INITIAL_STATE,
    isCustomCollation: IS_CUSTOM_COLLATION_INITIAL_STATE,
    isTimeSeries: IS_TIME_SERIES_INITIAL_STATE,
    isRunning: IS_RUNNING_INITIAL_STATE,
    isVisible: IS_VISIBLE_INITIAL_STATE,
    name: NAME_INITIAL_STATE,
    databaseName: DATABASE_NAME_INITIAL_STATE,
    error: ERROR_INITIAL_STATE,
    collation: COLLATION_INITIAL_STATE,
    timeSeries: TIME_SERIES_INITIAL_STATE
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


function buildOptions(state) {
  const cappedOptions = state.isCapped ? {
    capped: true,
    size: parseInt(state.cappedSize, 10)
  } : {};

  const collationOptions = state.isCustomCollation ? {
    collation: state.collation
  } : {};

  const timeSeriesOptions = state.isTimeSeries ? {
    timeseries: state.timeSeries
  } : {};

  return {
    ...collationOptions,
    ...cappedOptions,
    ...timeSeriesOptions
  };
}

export const createCollection = () => {
  return (dispatch, getState) => {
    const state = getState();
    const ds = state.dataService.dataService;
    const collectionName = state.name;
    const dbName = state.databaseName;
    const namespace = `${dbName}.${collectionName}`;

    dispatch(clearError());

    try {
      const options = buildOptions(state);
      dispatch(toggleIsRunning(true));

      ds.createCollection(namespace, options, (e) => {
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


