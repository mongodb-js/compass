import type { AnyAction } from 'redux';
import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import type {
  LoadGeneratedPipelineAction,
  PipelineGeneratedFromQueryAction,
} from './pipeline-builder/pipeline-ai';
import { AIPipelineActionTypes } from './pipeline-builder/pipeline-ai';
import type { RestorePipelineAction } from './saved-pipeline';
import { RESTORE_PIPELINE } from './saved-pipeline';
import type { ApplySettingsAction } from './settings';
import { APPLY_SETTINGS } from './settings';
import { isAction } from '@mongodb-js/compass-utils';

export type CommentsState = boolean;

/**
 * The initial state.
 */
export const INITIAL_STATE: CommentsState = true;

/**
 * Reducer function for handle state changes to comments.
 *
 * @param {Boolean} state - The name state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
export default function reducer(
  state: CommentsState = INITIAL_STATE,
  action: AnyAction
): CommentsState {
  if (isAction<ApplySettingsAction>(action, APPLY_SETTINGS)) {
    return action.settings.isCommentMode ?? state;
  }
  if (
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    ) ||
    isAction<LoadGeneratedPipelineAction>(
      action,
      AIPipelineActionTypes.LoadGeneratedPipeline
    ) ||
    isAction<PipelineGeneratedFromQueryAction>(
      action,
      AIPipelineActionTypes.PipelineGeneratedFromQuery
    )
  ) {
    return INITIAL_STATE;
  }
  if (isAction<RestorePipelineAction>(action, RESTORE_PIPELINE)) {
    return action.storedOptions.comments ?? INITIAL_STATE;
  }
  return state;
}
