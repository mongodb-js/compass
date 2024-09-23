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
import { isAction } from '@mongodb-js/compass-utils';

export type NameState = string;

export const INITIAL_STATE: NameState = '';

/**
 * Reducer function for handle state changes to name.
 */
const reducer: Reducer<NameState, Action> = (state = INITIAL_STATE, action) => {
  if (isAction<SavingPipelineApplyAction>(action, SAVING_PIPELINE_APPLY)) {
    return action.name;
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
    return action.storedOptions.name;
  }
  return state;
};

export default reducer;
