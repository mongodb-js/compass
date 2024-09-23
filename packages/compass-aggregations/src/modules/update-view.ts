import toNS from 'mongodb-ns';
import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import {
  getPipelineFromBuilderState,
  mapPipelineModeToEditorViewType,
} from './pipeline-builder/builder-helpers';
import type { PipelineBuilderThunkAction } from '.';
import { isAction } from '@mongodb-js/compass-utils';

import type { AnyAction } from 'redux';

export type UpdateViewState = null | string;

/**
 * State `null` when there is no error, or string if there's an error.
 */
export const INITIAL_STATE: UpdateViewState = null;

// Action for when an error occurs when updating a view.
export const ERROR_UPDATING_VIEW =
  'aggregations/update-view/ERROR_UPDATING_VIEW' as const;
interface ErrorUpdatingViewAction {
  type: typeof ERROR_UPDATING_VIEW;
  error: string;
}

// Action for dismissing the error that occured when updating a view.
export const DISMISS_VIEW_UPDATE_ERROR =
  'aggregations/update-view/DISMISS_VIEW_UPDATE_ERROR' as const;
interface DismissViewUpdateErrorAction {
  type: typeof DISMISS_VIEW_UPDATE_ERROR;
}

export type UpdateViewAction =
  | ErrorUpdatingViewAction
  | DismissViewUpdateErrorAction;

export default function reducer(
  state: UpdateViewState = INITIAL_STATE,
  action: AnyAction
): UpdateViewState {
  if (isAction<ErrorUpdatingViewAction>(action, ERROR_UPDATING_VIEW)) {
    return action.error;
  }
  if (
    isAction<DismissViewUpdateErrorAction>(action, DISMISS_VIEW_UPDATE_ERROR) ||
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    )
  ) {
    return INITIAL_STATE;
  }
  return state;
}

/**
 * Action creator for showing the error that occured with updating the view.
 */
export const updateViewErrorOccured = (
  error: Error | string
): ErrorUpdatingViewAction => ({
  type: ERROR_UPDATING_VIEW,
  error: `${error}`,
});

/**
 * Action creator for dismissing any error that occured with updating the view.
 *
 * @returns {Object} The action.
 */
export const dismissViewError = (): DismissViewUpdateErrorAction => ({
  type: DISMISS_VIEW_UPDATE_ERROR,
});

/**
 * Updates a view.
 *
 * @returns {Function} The function.
 */
export const updateView = (): PipelineBuilderThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    {
      pipelineBuilder,
      workspaces,
      logger: { debug },
      track,
      connectionScopedAppRegistry,
      connectionInfoRef,
    }
  ) => {
    dispatch(dismissViewError());

    const state = getState();
    const ds = state.dataService.dataService;
    const viewNamespace = state.editViewName;

    if (!viewNamespace) {
      return;
    }

    const connectionInfo = connectionInfoRef.current;

    const viewPipeline = getPipelineFromBuilderState(
      getState(),
      pipelineBuilder
    );
    const options = {
      viewOn: toNS(state.namespace).collection,
      pipeline: viewPipeline,
    };

    try {
      await ds!.updateCollection(viewNamespace, options);
      track(
        'View Updated',
        {
          num_stages: viewPipeline.length,
          editor_view_type: mapPipelineModeToEditorViewType(state),
        },
        connectionInfo
      );
      debug('selecting namespace', viewNamespace);
      connectionScopedAppRegistry.emit('view-edited', viewNamespace);
      workspaces.openCollectionWorkspace(connectionInfo.id, viewNamespace);
    } catch (e: any) {
      debug('Unexpected error updating view', e);
      dispatch(updateViewErrorOccured(e));
    }
  };
};
