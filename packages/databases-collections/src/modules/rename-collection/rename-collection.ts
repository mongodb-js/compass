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
export const open = ({
  connectionId,
  db,
  collection,
  collections,
  areSavedQueriesAndAggregationsImpacted,
}: {
  connectionId: string;
  db: string;
  collection: string;
  collections: { name: string }[];
  areSavedQueriesAndAggregationsImpacted: boolean;
}) => ({
  type: OPEN,
  connectionId,
  db,
  collection,
  collections,
  areSavedQueriesAndAggregationsImpacted,
});

export const close = () => ({
  type: CLOSE,
});

export const renameRequestInProgress = () => ({
  type: RENAME_REQUEST_IN_PROGRESS,
});

const handleError = (error: Error | null) => ({
  type: HANDLE_ERROR,
  error,
});

export type RenameCollectionRootState = {
  error: Error | null;
  initialCollectionName: string;
  isRunning: boolean;
  isVisible: boolean;
  connectionId: string;
  databaseName: string;
  collections: { name: string }[];
  areSavedQueriesAndAggregationsImpacted: boolean;
};

const defaultState: RenameCollectionRootState = {
  isRunning: false,
  isVisible: false,
  error: null,
  connectionId: '',
  databaseName: '',
  initialCollectionName: '',
  collections: [],
  areSavedQueriesAndAggregationsImpacted: true,
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
      connectionId: action.connectionId,
      databaseName: action.db,
      collections: action.collections,
      areSavedQueriesAndAggregationsImpacted:
        action.areSavedQueriesAndAggregationsImpacted,
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

export const clearError = (): ThunkAction<
  void,
  RenameCollectionRootState,
  void,
  AnyAction
> => {
  return (dispatch) => {
    dispatch(handleError(null));
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
  return async (
    dispatch,
    getState,
    { connectionsManager, globalAppRegistry }
  ) => {
    const state = getState();
    const { connectionId, databaseName, initialCollectionName } = state;
    const dataService =
      connectionsManager.getDataServiceForConnection(connectionId);

    if (!dataService) {
      throw new Error(
        'unreachable: The modal is only shown when the connection is active.'
      );
    }

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
