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
  OPEN_BULK_UPDATE: 'crud/bulk-update/OPEN_BULK_UPDATE',
  CLOSE_BULK_UPDATE: 'crud/bulk-update/CLOSE_BULK_UPDATE',
  BULK_UPDATE_STARTED: 'crud/bulk-update/BULK_UPDATE_STARTED',
  FETCH_PREVIEW_FINISHED: 'crud/bulk-update/FETCH_PREVIEW_FINISHED',
  FETCH_PREVIEW_SYNTAX_ERRORED: 'crud/bulk-update/FETCH_PREVIEW_SYNTAX_ERRORED',
  FETCH_PREVIEW_SERVER_ERRORED: 'crud/bulk-update/FETCH_PREVIEW_SERVER_ERRORED',
} as const;

export type OpenBulkUpdateAction = {
  type: typeof BulkUpdateActionTypes.OPEN_BULK_UPDATE;
};

export type CloseBulkUpdateAction = {
  type: typeof BulkUpdateActionTypes.CLOSE_BULK_UPDATE;
};

export type BulkUpdateStartedAction = {
  type: typeof BulkUpdateActionTypes.BULK_UPDATE_STARTED;
};

export type PreviewUpdatedAction = {
  type: typeof BulkUpdateActionTypes.FETCH_PREVIEW_FINISHED;
  updateText: string;
  preview: UpdatePreview;
};

export type PreviewSyntaxErrorAction = {
  type: typeof BulkUpdateActionTypes.FETCH_PREVIEW_SYNTAX_ERRORED;
  updateText: string;
  syntaxError: Error;
};

export type PreviewServerErrorAction = {
  type: typeof BulkUpdateActionTypes.FETCH_PREVIEW_SERVER_ERRORED;
  updateText: string;
  serverError: Error;
};

export type BulkUpdateActions =
  | OpenBulkUpdateAction
  | CloseBulkUpdateAction
  | BulkUpdateStartedAction
  | PreviewUpdatedAction
  | PreviewSyntaxErrorAction
  | PreviewServerErrorAction;

export const bulkUpdateReducer: Reducer<BulkUpdateState> = (
  state = INITIAL_BULK_UPDATE_STATE,
  action
) => {
  if (isAction(action, BulkUpdateActionTypes.OPEN_BULK_UPDATE)) {
    return { ...state, isOpen: true };
  }
  if (isAction(action, BulkUpdateActionTypes.CLOSE_BULK_UPDATE)) {
    return { ...state, isOpen: false };
  }
  if (isAction(action, BulkUpdateActionTypes.BULK_UPDATE_STARTED)) {
    return { ...state, isOpen: false };
  }
  if (isAction(action, BulkUpdateActionTypes.FETCH_PREVIEW_FINISHED)) {
    return {
      ...state,
      updateText: action.updateText,
      preview: action.preview,
      serverError: undefined,
      syntaxError: undefined,
    };
  }
  if (isAction(action, BulkUpdateActionTypes.FETCH_PREVIEW_SYNTAX_ERRORED)) {
    return {
      ...state,
      updateText: action.updateText,
      preview: { changes: [] },
      serverError: undefined,
      syntaxError: action.syntaxError,
    };
  }
  if (isAction(action, BulkUpdateActionTypes.FETCH_PREVIEW_SERVER_ERRORED)) {
    return {
      ...state,
      updateText: action.updateText,
      preview: { changes: [] },
      serverError: action.serverError,
      syntaxError: undefined,
    };
  }
  return state;
};

export function closeBulkUpdateModal(): CloseBulkUpdateAction {
  return { type: BulkUpdateActionTypes.CLOSE_BULK_UPDATE };
}

export function updateBulkUpdatePreview(
  updateText: string
): CrudThunkAction<Promise<void>, BulkUpdateActions> {
  return async (
    dispatch,
    getState,
    { dataService, queryBar, bulkUpdatePreviewAbortControllerRef }
  ) => {
    const state = getState();
    bulkUpdatePreviewAbortControllerRef.current?.abort();

    // If preview is not supported, just verify the update parses.
    if (!state.collectionMeta.isUpdatePreviewSupported) {
      try {
        parseShellBSON(updateText);
      } catch (err: any) {
        dispatch({
          type: BulkUpdateActionTypes.FETCH_PREVIEW_SYNTAX_ERRORED,
          updateText,
          syntaxError: err,
        });
        return;
      }
      dispatch({
        type: BulkUpdateActionTypes.FETCH_PREVIEW_FINISHED,
        updateText,
        preview: { changes: [] },
      });
      return;
    }

    const abortController = new AbortController();
    bulkUpdatePreviewAbortControllerRef.current = abortController;

    let update: BSONObject | BSONObject[];
    try {
      update = parseShellBSON(updateText);
    } catch (err: any) {
      bulkUpdatePreviewAbortControllerRef.current = undefined;
      dispatch({
        type: BulkUpdateActionTypes.FETCH_PREVIEW_SYNTAX_ERRORED,
        updateText,
        syntaxError: err,
      });
      return;
    }

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
      bulkUpdatePreviewAbortControllerRef.current = undefined;
      dispatch({
        type: BulkUpdateActionTypes.FETCH_PREVIEW_SERVER_ERRORED,
        updateText,
        serverError: err,
      });
      return;
    }

    if (abortController.signal.aborted) return;

    bulkUpdatePreviewAbortControllerRef.current = undefined;
    dispatch({
      type: BulkUpdateActionTypes.FETCH_PREVIEW_FINISHED,
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
    dispatch({ type: BulkUpdateActionTypes.OPEN_BULK_UPDATE });
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

    dispatch({ type: BulkUpdateActionTypes.BULK_UPDATE_STARTED });

    // Latch the affected count for the duration of the toast.
    const affected = getState().documents.count ?? undefined;

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
