import { combineReducers } from 'redux';
import dataService from '../data-service';
import serverVersion from '../server-version';
import isRunning, {
  INITIAL_STATE as IS_RUNNING_INITIAL_STATE,
} from '../is-running';
import isVisible, {
  INITIAL_STATE as IS_VISIBLE_INITIAL_STATE,
} from '../is-visible';
import error, { INITIAL_STATE as ERROR_INITIAL_STATE } from '../error';
import { RESET } from '../reset';
import { createCollection } from '../create-collection';

/**
 * Open action name.
 */
const OPEN = 'databases-collections/create-database/OPEN';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  isRunning,
  isVisible,
  error,
  serverVersion,
  dataService,
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
      error: ERROR_INITIAL_STATE,
    };
  } else if (action.type === OPEN) {
    return {
      ...state,
      isVisible: true,
      isRunning: IS_RUNNING_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
    };
  }
  return reducer(state, action);
};

export default rootReducer;

/**
 * Open create database action creator.
 *
 * @returns {Object} The action.
 */
export const open = () => ({
  type: OPEN,
});

export const createDatabase = (data) => {
  return createCollection(data, 'Database');
};
