import { combineReducers } from 'redux';
import name, {
  INITIAL_STATE as NAME_INITIAL_STATE
} from 'modules/drop-database/name';
import nameConfirmation, {
  INITIAL_STATE as NAME_CONFIRMATION_INITIAL_STATE
} from 'modules/drop-database/name-confirmation';
import dataService from 'modules/data-service';

/**
 * The reset action name.
 */
export const RESET = 'ddl/drop-database/RESET';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  name,
  nameConfirmation,
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
      name: NAME_INITIAL_STATE,
      nameConfirmation: NAME_CONFIRMATION_INITIAL_STATE
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
 * Stop progress and set the error.
 *
 * @param {Function} dispatch - The dispatch function.
 * @param {Error} err - The error.
 *
 * @return {Object} The result.
 */
const stopWithError = () => {
  // dispatch(toggleIsRunning(false));
  // return dispatch(handleError(err));
};

/**
 * The drop database action.
 *
 * @returns {Function} The thunk function.
 */
export const dropDatabase = () => {
  return (dispatch, getState) => {
    const state = getState();
    const ds = state.dataService.dataService;
    const dbName = state.name;

    // dispatch(clearError());

    try {
      // dispatch(toggleIsRunning(true));
      ds.dropDatabase(dbName, (e) => {
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
