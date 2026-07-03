import type { Reducer } from 'redux';
import type { UpdatePreview } from 'mongodb-data-service';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import { openToast } from '@mongodb-js/compass-components';
import { isAction } from '../utils/is-action';
import type { CrudThunkAction } from './reducer';
import { parseShellBSON } from '../utils/parse-shell-bson';
import {
  openBulkUpdateFailureToast,
  openBulkUpdateProgressToast,
  openBulkUpdateSuccessToast,
} from '../components/bulk-actions-toasts';
import type { BSONObject } from './insert';
import { refreshDocuments } from './documents';

export const INITIAL_BULK_UPDATE_TEXT = `{
  $set: {

  },
}`;

export type BulkUpdateState = {
  isOpen: boolean;
  updateText: string;
  preview: UpdatePreview;
  syntaxError?: Error;
  serverError?: Error;
  previewAbortController?: AbortController;
  affected?: number;
};

export const INITIAL_BULK_UPDATE_STATE: BulkUpdateState = {
  isOpen: false,
  updateText: INITIAL_BULK_UPDATE_TEXT,
  preview: {
    changes: [],
  },
  syntaxError: undefined,
  serverError: undefined,
};

export const BulkUpdateActionTypes = {
  OPEN_MODAL: 'crud/bulk-update/OPEN_MODAL',
  CLOSE_MODAL: 'crud/bulk-update/CLOSE_MODAL',
  PREVIEW_STARTED: 'crud/bulk-update/PREVIEW_STARTED',
  PREVIEW_UPDATED: 'crud/bulk-update/PREVIEW_UPDATED',
  PREVIEW_SYNTAX_ERROR: 'crud/bulk-update/PREVIEW_SYNTAX_ERROR',
  PREVIEW_SERVER_ERROR: 'crud/bulk-update/PREVIEW_SERVER_ERROR',
  RUN_AFFECTED_LATCHED: 'crud/bulk-update/RUN_AFFECTED_LATCHED',
} as const;

export type OpenBulkUpdateModalAction = {
  type: typeof BulkUpdateActionTypes.OPEN_MODAL;
};

export type CloseBulkUpdateModalAction = {
  type: typeof BulkUpdateActionTypes.CLOSE_MODAL;
};

export type PreviewStartedAction = {
  type: typeof BulkUpdateActionTypes.PREVIEW_STARTED;
  abortController: AbortController;
};

export type PreviewUpdatedAction = {
  type: typeof BulkUpdateActionTypes.PREVIEW_UPDATED;
  updateText: string;
  preview: UpdatePreview;
};

export type PreviewSyntaxErrorAction = {
  type: typeof BulkUpdateActionTypes.PREVIEW_SYNTAX_ERROR;
  updateText: string;
  syntaxError: Error;
};

export type PreviewServerErrorAction = {
  type: typeof BulkUpdateActionTypes.PREVIEW_SERVER_ERROR;
  updateText: string;
  serverError: Error;
};

export type RunAffectedLatchedAction = {
  type: typeof BulkUpdateActionTypes.RUN_AFFECTED_LATCHED;
  affected: number | undefined;
};

export type BulkUpdateActions =
  | OpenBulkUpdateModalAction
  | CloseBulkUpdateModalAction
  | PreviewStartedAction
  | PreviewUpdatedAction
  | PreviewSyntaxErrorAction
  | PreviewServerErrorAction
  | RunAffectedLatchedAction;

export const bulkUpdateReducer: Reducer<BulkUpdateState> = (
  state = INITIAL_BULK_UPDATE_STATE,
  action
) => {
  if (isAction(action, BulkUpdateActionTypes.OPEN_MODAL)) {
    return { ...state, isOpen: true };
  }
  if (isAction(action, BulkUpdateActionTypes.CLOSE_MODAL)) {
    return { ...state, isOpen: false };
  }
  if (isAction(action, BulkUpdateActionTypes.PREVIEW_STARTED)) {
    return { ...state, previewAbortController: action.abortController };
  }
  if (isAction(action, BulkUpdateActionTypes.PREVIEW_UPDATED)) {
    return {
      ...state,
      updateText: action.updateText,
      preview: action.preview,
      serverError: undefined,
      syntaxError: undefined,
      previewAbortController: undefined,
    };
  }
  if (isAction(action, BulkUpdateActionTypes.PREVIEW_SYNTAX_ERROR)) {
    return {
      ...state,
      updateText: action.updateText,
      preview: { changes: [] },
      serverError: undefined,
      syntaxError: action.syntaxError,
      previewAbortController: undefined,
    };
  }
  if (isAction(action, BulkUpdateActionTypes.PREVIEW_SERVER_ERROR)) {
    return {
      ...state,
      updateText: action.updateText,
      preview: { changes: [] },
      serverError: action.serverError,
      syntaxError: undefined,
      previewAbortController: undefined,
    };
  }
  if (isAction(action, BulkUpdateActionTypes.RUN_AFFECTED_LATCHED)) {
    return { ...state, affected: action.affected };
  }
  return state;
};

export function closeBulkUpdateModal(): CloseBulkUpdateModalAction {
  return { type: BulkUpdateActionTypes.CLOSE_MODAL };
}

export function updateBulkUpdatePreview(
  updateText: string
): CrudThunkAction<Promise<void>, BulkUpdateActions> {
  return async (dispatch, getState, { dataService, queryBar }) => {
    const state = getState();
    state.bulkUpdate.previewAbortController?.abort();

    // If preview is not supported, just verify the update parses.
    if (!state.collectionMeta.isUpdatePreviewSupported) {
      try {
        parseShellBSON(updateText);
      } catch (err: any) {
        dispatch({
          type: BulkUpdateActionTypes.PREVIEW_SYNTAX_ERROR,
          updateText,
          syntaxError: err,
        });
        return;
      }
      dispatch({
        type: BulkUpdateActionTypes.PREVIEW_UPDATED,
        updateText,
        preview: { changes: [] },
      });
      return;
    }

    const abortController = new AbortController();
    dispatch({
      type: BulkUpdateActionTypes.PREVIEW_STARTED,
      abortController,
    });

    let update: BSONObject | BSONObject[];
    try {
      update = parseShellBSON(updateText);
    } catch (err: any) {
      if (abortController.signal.aborted) return;
      dispatch({
        type: BulkUpdateActionTypes.PREVIEW_SYNTAX_ERROR,
        updateText,
        syntaxError: err,
      });
      return;
    }

    if (abortController.signal.aborted) return;

    const ns = getState().documents.ns;
    const { filter = {} } = queryBar.getLastAppliedQuery('crud');

    let preview;
    try {
      preview = await dataService.previewUpdate(ns, filter, update, {
        sample: 3,
        abortSignal: abortController.signal,
      });
    } catch (err: any) {
      if (abortController.signal.aborted) return;
      dispatch({
        type: BulkUpdateActionTypes.PREVIEW_SERVER_ERROR,
        updateText,
        serverError: err,
      });
      return;
    }

    if (abortController.signal.aborted) return;

    dispatch({
      type: BulkUpdateActionTypes.PREVIEW_UPDATED,
      updateText,
      preview,
    });
  };
}

export function openBulkUpdateModal(
  updateText?: string
): CrudThunkAction<Promise<void>, BulkUpdateActions> {
  return async (dispatch, getState, { track, connectionInfoRef }) => {
    track(
      'Bulk Update Opened',
      {
        isUpdatePreviewSupported:
          getState().collectionMeta.isUpdatePreviewSupported,
      },
      connectionInfoRef.current
    );

    await dispatch(
      updateBulkUpdatePreview(updateText ?? INITIAL_BULK_UPDATE_TEXT)
    );
    dispatch({ type: BulkUpdateActionTypes.OPEN_MODAL });
  };
}

export function runBulkUpdate(): CrudThunkAction<
  Promise<void>,
  BulkUpdateActions
> {
  return async (
    dispatch,
    getState,
    {
      dataService,
      queryBar,
      recentQueriesStorage,
      logger,
      track,
      connectionInfoRef,
    }
  ) => {
    const query = queryBar.getLastAppliedQuery('crud');
    track(
      'Bulk Update Executed',
      {
        isUpdatePreviewSupported:
          getState().collectionMeta.isUpdatePreviewSupported,
        has_filter: Object.keys(query.filter ?? {}).length > 0,
      },
      connectionInfoRef.current
    );

    dispatch(closeBulkUpdateModal());

    // Latch the affected count for the duration of the toast.
    const affected = getState().documents.count ?? undefined;
    dispatch({
      type: BulkUpdateActionTypes.RUN_AFFECTED_LATCHED,
      affected,
    });

    const ns = getState().documents.ns;
    const { filter = {} } = query;
    let update;
    try {
      update = parseShellBSON(getState().bulkUpdate.updateText);
    } catch {
      // If this couldn't parse then the update button should have been
      // disabled. So if we get here it is a race condition.
      return;
    }

    await recentQueriesStorage?.saveQuery({
      _ns: ns,
      filter,
      update,
    });

    openBulkUpdateProgressToast({
      affectedDocuments: affected,
    });

    try {
      await dataService.updateMany(ns, filter, update);

      openBulkUpdateSuccessToast({
        affectedDocuments: affected,
        onRefresh: () => void dispatch(refreshDocuments()),
      });
    } catch (err: any) {
      openBulkUpdateFailureToast({
        affectedDocuments: affected,
        error: err as Error,
      });

      logger.log.error(
        mongoLogId(1_001_000_269),
        'Bulk Update Documents',
        `Update operation failed: ${err.message}`,
        err
      );
    }
  };
}

export function saveUpdateQuery(
  name: string
): CrudThunkAction<Promise<void>, never> {
  return async (
    dispatch,
    getState,
    { favoriteQueriesStorage, queryBar, track, connectionInfoRef }
  ) => {
    track(
      'Bulk Update Favorited',
      {
        isUpdatePreviewSupported:
          getState().collectionMeta.isUpdatePreviewSupported,
      },
      connectionInfoRef.current
    );

    const { filter } = queryBar.getLastAppliedQuery('crud');
    let update;
    try {
      update = parseShellBSON(getState().bulkUpdate.updateText);
    } catch {
      return;
    }

    await favoriteQueriesStorage?.saveQuery({
      _name: name,
      _ns: getState().documents.ns,
      filter,
      update,
    });
    openToast('saved-favorite-update-query', {
      title: '',
      variant: 'success',
      dismissible: true,
      timeout: 6_000,
      description: `${name} added to "My Queries".`,
    });
  };
}
