import { combineReducers } from 'redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { AnyAction, Dispatch } from 'redux';

import dataService from '../data-service';
import appRegistry, {
  localAppRegistryEmit,
} from '@mongodb-js/mongodb-redux-common/app-registry';
import error, {
  clearError,
  handleError,
  INITIAL_STATE as ERROR_INITIAL_STATE,
} from './error';
import inProgress, {
  toggleInProgress,
  INITIAL_STATE as IN_PROGRESS_INITIAL_STATE,
} from '../in-progress';
import isVisible, {
  toggleIsVisible,
  INITIAL_STATE as IS_VISIBLE_INITIAL_STATE,
} from '../is-visible';
import name, { INITIAL_STATE as NAME_INITIAL_STATE } from '../drop-index/name';
import confirmName, {
  INITIAL_STATE as CONFIRM_NAME_INITIAL_STATE,
} from '../drop-index/confirm-name';

import { RESET_FORM, resetForm } from '../reset-form';
import namespace from '../namespace';

const { track } = createLoggerAndTelemetry('COMPASS-INDEXES-UI');

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
  namespace,
});

export type RootState = ReturnType<typeof reducer>;

/**
 * The root reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const rootReducer = (state: RootState, action: AnyAction) => {
  if (action.type === RESET_FORM) {
    return {
      ...state,
      inProgress: IN_PROGRESS_INITIAL_STATE,
      isVisible: IS_VISIBLE_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
      name: NAME_INITIAL_STATE,
      confirmName: CONFIRM_NAME_INITIAL_STATE,
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
export const dropIndex = (indexName: string) => {
  return async (dispatch: Dispatch, getState: () => RootState) => {
    const state = getState();
    const ns = state.namespace;

    dispatch(toggleInProgress(true));
    try {
      await state.dataService?.dropIndex(ns, indexName);
      track('Index Dropped', {
        atlas_search: false,
      });
      dispatch(resetForm());
      dispatch(localAppRegistryEmit('refresh-regular-indexes'));
      dispatch(clearError());
      dispatch(toggleInProgress(false));
      dispatch(toggleIsVisible(false));
    } catch (err) {
      dispatch(toggleInProgress(false));
      dispatch(handleError((err as Error).message));
    }
  };
};
