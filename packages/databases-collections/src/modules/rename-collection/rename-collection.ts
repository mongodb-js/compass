import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import type { Reducer } from 'redux';
import type { RenameCollectionPluginServices } from '../../stores/rename-collection';
import { openToast } from '@mongodb-js/compass-components';

/**
 * Open action name.
 */
const OPEN = 'databases-collections/rename-collection/OPEN';
const CLOSE = 'database-collections/rename-collection/CLOSE';
const RENAME_REQUEST_IN_PROGRESS =
  'database-collections/rename-collection/TOGGLE_IS_RUNNING';
const HANDLE_ERROR = 'database-collections/rename-collection/HANDLE_ERROR';

/**
 * Open drop database action creator.
 */
export const open = (db: string, collection: string) => ({
  type: OPEN,
  db,
  collection,
});

export const close = () => ({
  type: CLOSE,
});

export const renameRequestInProgress = () => ({
  type: RENAME_REQUEST_IN_PROGRESS,
});

const handleError = (error: Error) => ({
  type: HANDLE_ERROR,
  error,
});

export type RenameCollectionRootState = {
  error: Error | null;
  initialCollectionName: string;
  isRunning: boolean;
  isVisible: boolean;
  databaseName: string;
};

const defaultState: RenameCollectionRootState = {
  isRunning: false,
  isVisible: false,
  error: null,
  databaseName: '',
  initialCollectionName: '',
};

const reducer: Reducer<RenameCollectionRootState, AnyAction> = (
  state: RenameCollectionRootState = defaultState,
  action: AnyAction
): RenameCollectionRootState => {
  if (action.type === CLOSE) {
    return defaultState;
  } else if (action.type === OPEN) {
    return {
      initialCollectionName: action.collection,
      databaseName: action.db,
      isVisible: true,
      isRunning: false,
      error: null,
    };
  } else if (action.type === RENAME_REQUEST_IN_PROGRESS) {
    return {
      ...state,
      isRunning: true,
      error: null,
    };
  } else if (action.type === HANDLE_ERROR) {
    return {
      ...state,
      error: action.error,
      isRunning: false,
    };
  }
  return state;
};

export default reducer;

export const hideModal = (): ThunkAction<
  void,
  RenameCollectionRootState,
  void,
  AnyAction
> => {
  return (dispatch) => {
    dispatch(close());
  };
};

/**
 * A thunk action that renames a collection.
 *  */
export const renameCollection = (
  newCollectionName: string
): ThunkAction<
  Promise<void>,
  RenameCollectionRootState,
  RenameCollectionPluginServices,
  AnyAction
> => {
  return async (dispatch, getState, { dataService, globalAppRegistry }) => {
    const state = getState();
    const { databaseName, initialCollectionName } = state;

    dispatch(renameRequestInProgress());
    const oldNamespace = `${databaseName}.${initialCollectionName}`;
    const newNamespace = `${databaseName}.${newCollectionName}`;

    try {
      await dataService.renameCollection(oldNamespace, newCollectionName);
      globalAppRegistry.emit('collection-renamed', {
        to: newNamespace,
        from: oldNamespace,
      });
      dispatch(close());
      openToast('collection-rename-success', {
        variant: 'success',
        title: `Collection renamed to ${newCollectionName}`,
        timeout: 5_000,
      });
    } catch (e) {
      dispatch(handleError(e as Error));
    }
  };
};
