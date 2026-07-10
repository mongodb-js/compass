import type { Reducer } from 'redux';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import { showConfirmation } from '@mongodb-js/compass-components';
import { isAction } from '../utils/is-action';
import type { CrudThunkAction } from './reducer';
import {
  openBulkDeleteFailureToast,
  openBulkDeleteProgressToast,
  openBulkDeleteSuccessToast,
} from '../components/bulk-actions-toasts';
import { refreshDocuments } from './documents';

export type BulkDeleteState = {
  previewDocumentsEJSON: string[];
  isOpen: boolean;
  affected?: number;
};

export const INITIAL_BULK_DELETE_STATE: BulkDeleteState = {
  previewDocumentsEJSON: [],
  isOpen: false,
  affected: 0,
};

export const BulkDeleteActionTypes = {
  OPEN_BULK_DELETE: 'crud/bulk-delete/OPEN_BULK_DELETE',
  CLOSE_BULK_DELETE: 'crud/bulk-delete/CLOSE_BULK_DELETE',
  BULK_DELETE_STARTED: 'crud/bulk-delete/BULK_DELETE_STARTED',
} as const;

export type OpenBulkDeleteDialogAction = {
  type: typeof BulkDeleteActionTypes.OPEN_BULK_DELETE;
  previewDocumentsEJSON: string[];
  affected: number | undefined;
};

export type CloseBulkDeleteDialogAction = {
  type: typeof BulkDeleteActionTypes.CLOSE_BULK_DELETE;
};

export type BulkDeleteStartedAction = {
  type: typeof BulkDeleteActionTypes.BULK_DELETE_STARTED;
};

export type BulkDeleteActions =
  | OpenBulkDeleteDialogAction
  | CloseBulkDeleteDialogAction
  | BulkDeleteStartedAction;

export const bulkDeleteReducer: Reducer<BulkDeleteState> = (
  state = INITIAL_BULK_DELETE_STATE,
  action
) => {
  if (isAction(action, BulkDeleteActionTypes.OPEN_BULK_DELETE)) {
    return {
      previewDocumentsEJSON: action.previewDocumentsEJSON,
      isOpen: true,
      affected: action.affected,
    };
  }
  if (isAction(action, BulkDeleteActionTypes.CLOSE_BULK_DELETE)) {
    return { ...state, isOpen: false };
  }
  if (isAction(action, BulkDeleteActionTypes.BULK_DELETE_STARTED)) {
    return { ...state, isOpen: false };
  }
  return state;
};

const PREVIEW_DOCS = 5;

export function openBulkDeleteDialog(): CrudThunkAction<
  void,
  OpenBulkDeleteDialogAction
> {
  return (dispatch, getState, { track, connectionInfoRef }) => {
    track('Bulk Delete Opened', {}, connectionInfoRef.current);

    const state = getState();
    // Store the serialized EJSON rather than Document instances so that the
    // state stays serializable and expanding/collapsing docs in the modal
    // doesn't modify the ones in the list.
    const previewDocumentsEJSON = (
      state.documents.docs?.slice(0, PREVIEW_DOCS) ?? []
    ).map((doc) => doc.toEJSON());
    dispatch({
      type: BulkDeleteActionTypes.OPEN_BULK_DELETE,
      previewDocumentsEJSON,
      affected: state.documents.count ?? undefined,
    });
  };
}

export function closeBulkDeleteDialog(): CloseBulkDeleteDialogAction {
  return { type: BulkDeleteActionTypes.CLOSE_BULK_DELETE };
}

export function runBulkDelete(): CrudThunkAction<
  Promise<void>,
  BulkDeleteActions
> {
  return async (
    dispatch,
    getState,
    {
      dataService,
      queryBar,
      logger,
      connectionScopedAppRegistry,
      track,
      connectionInfoRef,
    }
  ) => {
    const query = queryBar.getLastAppliedQuery('crud');

    const { affected } = getState().bulkDelete;
    dispatch(closeBulkDeleteDialog());

    const confirmation = await showConfirmation({
      title: 'Are you absolutely sure?',
      buttonText: `Delete ${affected ? `${affected} ` : ''} document${
        affected !== 1 ? 's' : ''
      }`,
      description: `This action cannot be undone. This will permanently delete ${
        affected ?? 'an unknown nudocuments-deletember of'
      } document${affected !== 1 ? 's' : ''}.`,
      warning:
        'The document list and count may not always reflect the latest updates in real time. This action will apply to all relevant documents, including those not currently visible, so please ensure they are handled safely.',
      variant: 'danger',
    });

    if (!confirmation) {
      return;
    }

    dispatch({ type: BulkDeleteActionTypes.BULK_DELETE_STARTED });
    openBulkDeleteProgressToast({
      affectedDocuments: affected,
    });

    const ns = getState().documents.ns;
    const view = getState().view.view;
    const { filter = {} } = query;
    try {
      await dataService.deleteMany(ns, filter);
      track(
        'Bulk Delete Executed',
        {
          has_filter: Object.keys(query.filter ?? {}).length > 0,
        },
        connectionInfoRef.current
      );
      openBulkDeleteSuccessToast({
        affectedDocuments: affected,
        onRefresh: () => void dispatch(refreshDocuments()),
      });
      const payload = { view, ns };
      connectionScopedAppRegistry.emit('documents-deleted', payload);
    } catch (ex) {
      openBulkDeleteFailureToast({
        affectedDocuments: affected,
        error: ex as Error,
      });
      logger.log.error(
        mongoLogId(1_001_000_268),
        'Bulk Delete Documents',
        `Delete operation failed: ${(ex as Error).message}`,
        ex
      );
    }
  };
}
