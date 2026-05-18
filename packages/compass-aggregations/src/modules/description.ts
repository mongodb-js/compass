import type { Action, Reducer } from 'redux';

import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import type {
  LoadGeneratedPipelineAction,
  PipelineGeneratedFromQueryAction,
} from './pipeline-builder/pipeline-ai';
import { AIPipelineActionTypes } from './pipeline-builder/pipeline-ai';
import type { RestorePipelineAction } from './saved-pipeline';
import { RESTORE_PIPELINE } from './saved-pipeline';
import type { SavingPipelineApplyAction } from './saving-pipeline';
import { SAVING_PIPELINE_APPLY } from './saving-pipeline';
import { isAction } from '../utils/is-action';

/**
 * Free-text description of what the saved pipeline does. Surfaced to AI
 * agents via the MCP `list-saved-queries` tool — pipelines without a
 * description are hidden from the catalog. Mirrors the `name` slice
 * almost exactly: persists across the modal close so
 * `saveCurrentPipeline` (which runs after `savingPipelineApply` resets
 * the modal) can read it from top-level state.
 */
export type DescriptionState = string;

export const INITIAL_STATE: DescriptionState = '';

const reducer: Reducer<DescriptionState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction<SavingPipelineApplyAction>(action, SAVING_PIPELINE_APPLY)) {
    return action.description;
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
    return action.storedOptions.description ?? INITIAL_STATE;
  }
  return state;
};

export default reducer;
