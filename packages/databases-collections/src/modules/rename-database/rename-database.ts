import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import type { Reducer } from 'redux';
import type { RenameDatabasePluginServices } from '../../stores/rename-database';
import { openToast } from '@mongodb-js/compass-components';

const OPEN = 'databases-collections/rename-database/OPEN';
const CONFIRMATION_REQUIRED =
  'databases-collections/rename-database/CONFIRMATION_REQUIRED';
const CLOSE = 'databases-collections/rename-database/CLOSE';
const RENAME_REQUEST_IN_PROGRESS =
  'databases-collections/rename-database/TOGGLE_IS_RUNNING';
const HANDLE_ERROR = 'databases-collections/rename-database/HANDLE_ERROR';

export const open = ({
  connectionId,
  db,
  databases,
  collectionCount,
  hasViews,
  areSavedQueriesAndAggregationsImpacted,
}: {
  connectionId: string;
  db: string;
  databases: { name: string }[];
  collectionCount: number;
  hasViews: boolean;
  areSavedQueriesAndAggregationsImpacted: boolean;
}) => ({
  type: OPEN,
  connectionId,
  db,
  databases,
  collectionCount,
  hasViews,
  areSavedQueriesAndAggregationsImpacted,
});

export const close = () => ({
  type: CLOSE,
});

export const renameRequestInProgress = () => ({
  type: RENAME_REQUEST_IN_PROGRESS,
});

export const confirmationRequired = () => ({
  type: CONFIRMATION_REQUIRED,
});

const handleError = (error: Error | null) => ({
  type: HANDLE_ERROR,
  error,
});

export type RenameDatabaseRootState = {
  error: Error | null;
  initialDatabaseName: string;
  isRunning: boolean;
  modalState: 'input-form' | 'confirmation-screen' | 'hidden';
  connectionId: string;
  databases: { name: string }[];
  collectionCount: number;
  hasViews: boolean;
  areSavedQueriesAndAggregationsImpacted: boolean;
};

const defaultState: RenameDatabaseRootState = {
  isRunning: false,
  modalState: 'hidden',
  error: null,
  connectionId: '',
  initialDatabaseName: '',
  databases: [],
  collectionCount: 0,
  hasViews: false,
  areSavedQueriesAndAggregationsImpacted: false,
};

const reducer: Reducer<RenameDatabaseRootState, AnyAction> = (
  state: RenameDatabaseRootState = defaultState,
  action: AnyAction
): RenameDatabaseRootState => {
  if (action.type === CLOSE) {
    return defaultState;
  } else if (action.type === OPEN) {
    return {
      initialDatabaseName: action.db,
      connectionId: action.connectionId,
      databases: action.databases,
      collectionCount: action.collectionCount,
      hasViews: action.hasViews,
      areSavedQueriesAndAggregationsImpacted:
        action.areSavedQueriesAndAggregationsImpacted,
      modalState: 'input-form',
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
      modalState: 'input-form',
      isRunning: false,
    };
  } else if (action.type === CONFIRMATION_REQUIRED) {
    return {
      ...state,
      modalState: 'confirmation-screen',
    };
  }
  return state;
};

export default reducer;

export const submitModal = (
  newDatabaseName: string
): ThunkAction<
  Promise<void>,
  RenameDatabaseRootState,
  RenameDatabasePluginServices,
  AnyAction
> => {
  return async (dispatch, getState) => {
    const { modalState } = getState();
    if (modalState !== 'confirmation-screen') {
      dispatch(confirmationRequired());
    } else {
      await dispatch(renameDatabase(newDatabaseName));
    }
  };
};

export const hideModal = (): ThunkAction<
  void,
  RenameDatabaseRootState,
  void,
  AnyAction
> => {
  return (dispatch) => {
    dispatch(close());
  };
};

export const clearError = (): ThunkAction<
  void,
  RenameDatabaseRootState,
  void,
  AnyAction
> => {
  return (dispatch) => {
    dispatch(handleError(null));
  };
};

/**
 * A thunk action that renames a database by moving every collection to the new
 * database name and dropping the old one.
 */
export const renameDatabase = (
  newDatabaseName: string
): ThunkAction<
  Promise<void>,
  RenameDatabaseRootState,
  RenameDatabasePluginServices,
  AnyAction
> => {
  return async (dispatch, getState, { connections, globalAppRegistry }) => {
    const sanitizedNewName = newDatabaseName.trim();
    const state = getState();
    const { connectionId, initialDatabaseName } = state;
    const dataService = connections.getDataServiceForConnection(connectionId);

    dispatch(renameRequestInProgress());

    try {
      await dataService.renameDatabase(initialDatabaseName, sanitizedNewName);
      globalAppRegistry.emit(
        'database-renamed',
        {
          from: initialDatabaseName,
          to: sanitizedNewName,
        },
        {
          connectionId,
        }
      );
      // Also emit a database-dropped event so that sidebars, saved queries
      // panels and other listeners that care about namespace lifecycle can
      // react to the source database disappearing.
      globalAppRegistry.emit('database-dropped', initialDatabaseName, {
        connectionId,
      });
      dispatch(close());
      openToast('database-rename-success', {
        variant: 'success',
        title: `Database renamed to ${sanitizedNewName}`,
        timeout: 5_000,
      });
    } catch (e) {
      dispatch(handleError(e as Error));
    }
  };
};
