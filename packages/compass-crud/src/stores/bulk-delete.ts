import type { Reducer } from 'redux';
import type { BulkDeleteState } from './crud-types';

// Action Types
export enum BulkDeleteActionTypes {
  OPEN_BULK_DELETE_DIALOG = 'compass-crud/OPEN_BULK_DELETE_DIALOG',
  CLOSE_BULK_DELETE_DIALOG = 'compass-crud/CLOSE_BULK_DELETE_DIALOG',
  BULK_DELETE_IN_PROGRESS = 'compass-crud/BULK_DELETE_IN_PROGRESS',
  BULK_DELETE_SUCCESS = 'compass-crud/BULK_DELETE_SUCCESS',
  BULK_DELETE_FAILED = 'compass-crud/BULK_DELETE_FAILED',
}

// Action Interfaces
export type OpenBulkDeleteDialogAction = {
  type: BulkDeleteActionTypes.OPEN_BULK_DELETE_DIALOG;
  payload: Partial<BulkDeleteState>;
};

export type CloseBulkDeleteDialogAction = {
  type: BulkDeleteActionTypes.CLOSE_BULK_DELETE_DIALOG;
};

export type BulkDeleteInProgressAction = {
  type: BulkDeleteActionTypes.BULK_DELETE_IN_PROGRESS;
};

export type BulkDeleteSuccessAction = {
  type: BulkDeleteActionTypes.BULK_DELETE_SUCCESS;
};

export type BulkDeleteFailedAction = {
  type: BulkDeleteActionTypes.BULK_DELETE_FAILED;
};

export type BulkDeleteActions =
  | OpenBulkDeleteDialogAction
  | CloseBulkDeleteDialogAction
  | BulkDeleteInProgressAction
  | BulkDeleteSuccessAction
  | BulkDeleteFailedAction;

// Initial State
const INITIAL_STATE: BulkDeleteState = {
  previews: [],
  status: 'closed',
  affected: 0,
};

// Reducer
export const bulkDeleteReducer: Reducer<BulkDeleteState> = (
  state = INITIAL_STATE,
  action
) => {
  if (action.type === BulkDeleteActionTypes.OPEN_BULK_DELETE_DIALOG) {
    return {
      ...state,
      ...action.payload,
      status: 'open' as const,
    };
  }

  if (action.type === BulkDeleteActionTypes.CLOSE_BULK_DELETE_DIALOG) {
    return {
      ...state,
      status: 'closed' as const,
    };
  }

  if (action.type === BulkDeleteActionTypes.BULK_DELETE_IN_PROGRESS) {
    return {
      ...state,
      status: 'in-progress' as const,
    };
  }

  if (action.type === BulkDeleteActionTypes.BULK_DELETE_SUCCESS) {
    return INITIAL_STATE;
  }

  if (action.type === BulkDeleteActionTypes.BULK_DELETE_FAILED) {
    return {
      ...state,
      status: 'closed' as const,
    };
  }

  return state;
};

// Action Creators
import type { CrudThunkAction } from './reducer';
import { Document } from 'hadron-document';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import { showConfirmation } from '@mongodb-js/compass-components';
import {
  openBulkDeleteProgressToast,
  openBulkDeleteSuccessToast,
  openBulkDeleteFailureToast,
} from '../components/bulk-actions-toasts';

export const openBulkDeleteDialog = (): CrudThunkAction<
  Promise<void>,
  BulkDeleteActions
> => {
  return async (dispatch, getState, { dataService, queryBar, logger }) => {
    const state = getState();
    const { ns } = state.crud!;

    const query = queryBar.getLastAppliedQuery('crud');
    const filter = query.filter ?? {};

    try {
      const docs = await dataService.find(ns, filter, { limit: 10 }, {});

      const previews = docs.map((doc: any) => new Document(doc));

      dispatch({
        type: BulkDeleteActionTypes.OPEN_BULK_DELETE_DIALOG,
        payload: {
          previews,
          affected: previews.length,
        },
      });
    } catch (error: any) {
      logger.log.error(
        mongoLogId(1_001_000_082),
        'BulkDelete',
        'Failed to load delete preview',
        error
      );
    }
  };
};

export const closeBulkDeleteDialog = (): CloseBulkDeleteDialogAction => ({
  type: BulkDeleteActionTypes.CLOSE_BULK_DELETE_DIALOG,
});

export const runBulkDelete = (): CrudThunkAction<
  Promise<void>,
  BulkDeleteActions
> => {
  return async (dispatch, getState, services) => {
    const {
      dataService,
      queryBar,
      track,
      connectionInfoRef,
      logger,
      localAppRegistry,
      connectionScopedAppRegistry,
    } = services;

    const rootState = getState();
    const crudState = rootState.crud;
    const bulkDeleteState = rootState.bulkDelete;
    if (!crudState) return;
    const { ns, view } = crudState;

    // Show confirmation
    const confirmed = await showConfirmation({
      title: 'Delete Documents',
      description:
        'Are you sure you want to delete the selected documents? This action cannot be undone.',
      buttonText: 'Delete',
      variant: 'danger',
    });

    if (!confirmed) {
      return;
    }

    dispatch({ type: BulkDeleteActionTypes.BULK_DELETE_IN_PROGRESS });

    const query = queryBar.getLastAppliedQuery('crud');
    const filter = query.filter ?? {};

    openBulkDeleteProgressToast({
      affectedDocuments: bulkDeleteState.affected,
    });

    try {
      const result = await dataService.deleteMany(ns, filter);

      track(
        'Document Deleted',
        {
          mode: view.toLowerCase() as 'list' | 'json' | 'table',
        },
        connectionInfoRef.current
      );

      openBulkDeleteSuccessToast({
        affectedDocuments: result.deletedCount ?? 0,
        onRefresh: () => {
          // This callback will be called from the toast
        },
      });

      dispatch({ type: BulkDeleteActionTypes.BULK_DELETE_SUCCESS });

      const payload = { view, ns };
      localAppRegistry.emit('document-deleted', payload);
      connectionScopedAppRegistry.emit('document-deleted', payload);
    } catch (error) {
      logger.log.error(
        mongoLogId(1_001_000_083),
        'BulkDelete',
        'Failed to run bulk delete',
        error
      );

      openBulkDeleteFailureToast({
        affectedDocuments: bulkDeleteState.affected,
        error: error as Error,
      });

      dispatch({ type: BulkDeleteActionTypes.BULK_DELETE_FAILED });
    }
  };
};

export const openDeleteQueryExportToLanguageDialog = (): CrudThunkAction<
  void,
  BulkDeleteActions
> => {
  return (_dispatch, getState, { localAppRegistry, queryBar }) => {
    const query = queryBar.getLastAppliedQuery('crud');
    localAppRegistry.emit('open-query-export-to-language', {
      query,
      aggregation: undefined,
    });
  };
};
