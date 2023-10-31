import { combineReducers } from 'redux';
import type { AnyAction } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';

import isRunning, {
  toggleIsRunning,
  INITIAL_STATE as IS_RUNNING_INITIAL_STATE,
} from '../is-running';
import isVisible, {
  INITIAL_STATE as IS_VISIBLE_INITIAL_STATE,
} from '../is-visible';
import error, {
  clearError,
  handleError,
  INITIAL_STATE as ERROR_INITIAL_STATE,
} from '../error';
import dataService from '../data-service';
import appRegistry from '../app-registry';
import { openToast as openToastDefault } from '@mongodb-js/compass-components';
import type { Reducer } from 'redux';

/**
 * Open action name.
 */
const OPEN = 'databases-collections/rename-collection/OPEN';
const RESET = 'database-collections/rename-collection/RESET';

/**
 * Open drop database action creator.
 */
export const open = (db: string, collection: string) => ({
  type: OPEN,
  db,
  collection,
});

export const reset = () => ({
  type: RESET,
});

/**
 * A simple reducer that reduces a single string value.
 */
const stringReducer = (s = '') => s;

/**
 * The main reducer.
 */
const reducer = combineReducers({
  isRunning,
  isVisible,
  error,
  databaseName: stringReducer,
  initialCollectionName: stringReducer,
  dataService,
  appRegistry,
});

export type RenameCollectionRootState = ReturnType<typeof reducer>;

// @ts-expect-error state is never undefined
const rootReducer: Reducer<RenameCollectionRootState, AnyAction> = (
  state: RenameCollectionRootState,
  action: AnyAction
): RenameCollectionRootState => {
  if (action.type === RESET) {
    return {
      ...state,
      isRunning: IS_RUNNING_INITIAL_STATE,
      isVisible: IS_VISIBLE_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
      databaseName: '',
      initialCollectionName: '',
    };
  } else if (action.type === OPEN) {
    return {
      ...state,
      initialCollectionName: action.collection,
      databaseName: action.db,
      isVisible: true,
      isRunning: IS_RUNNING_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
    };
  }
  return reducer(state, action);
};

export default rootReducer;

/**
 * A thunk action that renames a collection.
 *  */
export const renameCollection = (
  newCollectionName: string,
  openToast: typeof openToastDefault = openToastDefault
): ThunkAction<Promise<void>, RenameCollectionRootState, void, AnyAction> => {
  return async (
    dispatch: ThunkDispatch<RenameCollectionRootState, void, AnyAction>,
    getState: () => RenameCollectionRootState
  ) => {
    const state = getState();
    const ds = state.dataService.dataService;
    const { databaseName, initialCollectionName } = state;

    dispatch(clearError());

    if (!ds) {
      return;
    }

    try {
      dispatch(toggleIsRunning(true));
      await ds.renameCollection(
        `${databaseName}.${initialCollectionName}`,
        newCollectionName
      );
      const { appRegistry } = getState();

      appRegistry?.emit('collection-renamed', {
        to: `${databaseName}.${newCollectionName}`,
        from: `${databaseName}.${initialCollectionName}`,
      });
      dispatch(reset());
      openToast('collection-rename-success', {
        variant: 'success',
        title: `Collection renamed to ${newCollectionName}`,
        timeout: 5_000,
      });
    } catch (e: any) {
      dispatch(toggleIsRunning(false));
      dispatch(handleError(e));
    }
  };
};
