import toNS from 'mongodb-ns';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import {
  getPipelineFromBuilderState,
  mapPipelineModeToEditorViewType,
} from './pipeline-builder/builder-helpers';
import type { PipelineBuilderThunkAction, RootAction } from '.';

const { track, debug } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

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
  action: RootAction
): UpdateViewState {
  if (action.type === ERROR_UPDATING_VIEW) {
    return action.error;
  }
  if (
    action.type === DISMISS_VIEW_UPDATE_ERROR ||
    action.type === ConfirmNewPipelineActions.NewPipelineConfirmed
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
  return async (dispatch, getState, { pipelineBuilder }) => {
    dispatch(dismissViewError());

    const state = getState();
    const ds = state.dataService.dataService;
    const viewNamespace = state.editViewName;
    const viewPipeline = getPipelineFromBuilderState(
      getState(),
      pipelineBuilder
    );
    const options = {
      viewOn: toNS(state.namespace).collection,
      pipeline: viewPipeline,
    };

    try {
      debug('calling data-service.updateCollection', viewNamespace);
      await ds!.updateCollection(viewNamespace!, options);
      dispatch(globalAppRegistryEmit('refresh-data'));
      track('View Updated', {
        num_stages: viewPipeline.length,
        editor_view_type: mapPipelineModeToEditorViewType(state),
      });
      debug('selecting namespace', viewNamespace);
      dispatch(
        globalAppRegistryEmit(
          'aggregations-open-view-after-update',
          viewNamespace
        )
      );
    } catch (e: any) {
      debug('Unexpected error updating view', e);
      dispatch(updateViewErrorOccured(e));
    }
  };
};
