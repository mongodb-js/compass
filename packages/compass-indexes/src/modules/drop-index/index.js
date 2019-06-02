import { combineReducers } from 'redux';

import dataService from 'modules/data-service';
import appRegistry, {
  localAppRegistryEmit
} from 'mongodb-redux-common/app-registry';
import error, {
  clearError, handleError,
  INITIAL_STATE as ERROR_INITIAL_STATE
} from 'modules/error';
import inProgress, {
  toggleInProgress,
  INITIAL_STATE as IN_PROGRESS_INITIAL_STATE
} from 'modules/in-progress';
import isVisible, {
  toggleIsVisible,
  INITIAL_STATE as IS_VISIBLE_INITIAL_STATE
} from 'modules/is-visible';
import name, {
  INITIAL_STATE as NAME_INITIAL_STATE
} from 'modules/drop-index/name';
import confirmName, {
  INITIAL_STATE as CONFIRM_NAME_INITIAL_STATE
} from 'modules/drop-index/confirm-name';

import { RESET_FORM } from 'modules/reset-form';
import { RESET, reset } from 'modules/reset';
import { parseErrorMsg } from 'modules/indexes';
import namespace, {
  INITIAL_STATE as NAMESPACE_INITIAL_STATE
} from 'modules/namespace';

/**
 * The main reducer.
 */
const reducer = combineReducers({
  dataService,
  appRegistry,
  isVisible,
  inProgress,
  error,
  name,
  confirmName,
  namespace
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
  if (action.type === RESET || action.type === RESET_FORM) {
    return {
      ...state,
      inProgress: IN_PROGRESS_INITIAL_STATE,
      isVisible: IS_VISIBLE_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
      name: NAME_INITIAL_STATE,
      confirmName: CONFIRM_NAME_INITIAL_STATE,
      namespace: NAMESPACE_INITIAL_STATE
    };
  }
  return reducer(state, action);
};

export default rootReducer;

/**
 * The drop index action.
 * @param {String} indexName - The name of the index to drop.
 *
 * @returns {Function} The thunk function.
 */
export const dropIndex = (indexName) => {
  return (dispatch, getState) => {
    const state = getState();
    const ns = state.namespace;

    dispatch(toggleInProgress(true));
    state.dataService.dropIndex(ns, indexName, (err) => {
      if (!err) {
        dispatch(reset());
        dispatch(localAppRegistryEmit('refresh-data'));
        dispatch(clearError());
        dispatch(toggleInProgress(false));
        dispatch(toggleIsVisible(false));
      } else {
        dispatch(toggleInProgress(false));
        dispatch(handleError(parseErrorMsg(err)));
      }
    });
  };
};
