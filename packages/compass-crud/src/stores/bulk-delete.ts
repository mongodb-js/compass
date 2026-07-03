import type { Reducer } from 'redux';
import { Document } from 'hadron-document';
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
  previews: Document[];
  status: 'open' | 'closed' | 'in-progress';
  affected?: number;
};

export const INITIAL_BULK_DELETE_STATE: BulkDeleteState = {
  previews: [],
  status: 'closed',
  affected: 0,
};

export const BulkDeleteActionTypes = {
  OPEN_DIALOG: 'crud/bulk-delete/OPEN_DIALOG',
  CLOSE_DIALOG: 'crud/bulk-delete/CLOSE_DIALOG',
  IN_PROGRESS: 'crud/bulk-delete/IN_PROGRESS',
} as const;

export type OpenBulkDeleteDialogAction = {
  type: typeof BulkDeleteActionTypes.OPEN_DIALOG;
  previews: Document[];
  affected: number | undefined;
};

export type CloseBulkDeleteDialogAction = {
  type: typeof BulkDeleteActionTypes.CLOSE_DIALOG;
};

export type BulkDeleteInProgressAction = {
  type: typeof BulkDeleteActionTypes.IN_PROGRESS;
};

export type BulkDeleteActions =
  | OpenBulkDeleteDialogAction
  | CloseBulkDeleteDialogAction
  | BulkDeleteInProgressAction;

export const bulkDeleteReducer: Reducer<BulkDeleteState> = (
  state = INITIAL_BULK_DELETE_STATE,
  action
) => {
  if (isAction(action, BulkDeleteActionTypes.OPEN_DIALOG)) {
    return {
      previews: action.previews,
      status: 'open',
      affected: action.affected,
    };
  }
  if (isAction(action, BulkDeleteActionTypes.CLOSE_DIALOG)) {
    return { ...state, status: 'closed' };
  }
  if (isAction(action, BulkDeleteActionTypes.IN_PROGRESS)) {
    return { ...state, status: 'in-progress' };
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
    const previews = (state.documents.docs?.slice(0, PREVIEW_DOCS) ?? []).map(
      (doc) => {
        // Break the link with the docs in the list so that expanding/collapsing
        // docs in the modal doesn't modify the ones in the list.
        return Document.FromEJSON(doc.toEJSON());
      }
    );
    dispatch({
      type: BulkDeleteActionTypes.OPEN_DIALOG,
      previews,
      affected: state.documents.count ?? undefined,
    });
  };
}

export function closeBulkDeleteDialog(): CloseBulkDeleteDialogAction {
  return { type: BulkDeleteActionTypes.CLOSE_DIALOG };
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
      localAppRegistry,
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
      description: `This action can not be undone. This will permanently delete ${
        affected ?? 'an unknown number of'
      } document${affected !== 1 ? 's' : ''}.`,
      warning:
        'The document list and count may not always reflect the latest updates in real time. This action will apply to all relevant documents, including those not currently visible, so please ensure they are handled safely.',
      variant: 'danger',
    });

    if (!confirmation) {
      return;
    }

    dispatch({ type: BulkDeleteActionTypes.IN_PROGRESS });
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
      // Emit both events so all listeners update (fixes bulk delete document count not updating)
      const payload = { view, ns };
      localAppRegistry.emit('documents-deleted', payload);
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
