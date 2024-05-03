import type { Reducer } from 'redux';

import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { ActionTypes as PipelineModeActionTypes } from './pipeline-builder/pipeline-mode';
import type { PipelineModeToggledAction } from './pipeline-builder/pipeline-mode';
import type {
  LoadGeneratedPipelineAction,
  PipelineGeneratedFromQueryAction,
} from './pipeline-builder/pipeline-ai';
import { AIPipelineActionTypes } from './pipeline-builder/pipeline-ai';
import type { RestorePipelineAction } from './saved-pipeline';
import { RESTORE_PIPELINE } from './saved-pipeline';
import { isAction } from '../utils/is-action';
import type { EditorValueChangeAction } from './pipeline-builder/text-editor-pipeline';
import { EditorActionTypes } from './pipeline-builder/text-editor-pipeline';
import type {
  ChangeStageDisabledAction,
  ChangeStageOperatorAction,
  ChangeStageValueAction,
  StageAddAction,
  StageMoveAction,
  StageRemoveAction,
} from './pipeline-builder/stage-editor';
import { StageEditorActionTypes } from './pipeline-builder/stage-editor';

// Used to visually indicate when the pipeline has been loaded
// from something like the ai generator or pipeline history.
type LoadedFromExternalSourceState = number | null;

const enum LoadedFromExternalActionTypes {
  ClearIsPipelineLoadedFromExternalSource = 'compass-aggregations/ClearIsPipelineLoadedFromExternalSource',
}

type ClearIsPipelineLoadedFromExternalSourceAction = {
  type: LoadedFromExternalActionTypes.ClearIsPipelineLoadedFromExternalSource;
};

export function clearIsPipelineLoadedFromExternalSource(): ClearIsPipelineLoadedFromExternalSourceAction {
  return {
    type: LoadedFromExternalActionTypes.ClearIsPipelineLoadedFromExternalSource,
  };
}

export const INITIAL_STATE: LoadedFromExternalSourceState = null;

/**
 * Reducer function for handle state changes to if the pipeline was loaded
 * from an external source (ai generated or pipeline history).
 */
const reducer: Reducer<LoadedFromExternalSourceState> = (
  state = INITIAL_STATE,
  action
) => {
  if (
    isAction<StageAddAction>(action, StageEditorActionTypes.StageAdded) ||
    isAction<StageMoveAction>(action, StageEditorActionTypes.StageMoved) ||
    isAction<ChangeStageDisabledAction>(
      action,
      StageEditorActionTypes.StageDisabledChange
    ) ||
    isAction<ChangeStageOperatorAction>(
      action,
      StageEditorActionTypes.StageOperatorChange
    ) ||
    isAction<StageRemoveAction>(action, StageEditorActionTypes.StageRemoved) ||
    isAction<ChangeStageValueAction>(
      action,
      StageEditorActionTypes.StageValueChange
    ) ||
    isAction<EditorValueChangeAction>(
      action,
      EditorActionTypes.EditorValueChange
    ) ||
    isAction<PipelineModeToggledAction>(
      action,
      PipelineModeActionTypes.PipelineModeToggled
    ) ||
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    ) ||
    isAction<ClearIsPipelineLoadedFromExternalSourceAction>(
      action,
      LoadedFromExternalActionTypes.ClearIsPipelineLoadedFromExternalSource
    )
  ) {
    return null;
  }
  if (
    isAction<RestorePipelineAction>(action, RESTORE_PIPELINE) ||
    isAction<LoadGeneratedPipelineAction>(
      action,
      AIPipelineActionTypes.LoadGeneratedPipeline
    ) ||
    isAction<PipelineGeneratedFromQueryAction>(
      action,
      AIPipelineActionTypes.PipelineGeneratedFromQuery
    )
  ) {
    return (state === null ? 1 : state + 1) % Number.MAX_SAFE_INTEGER;
  }
  return state;
};

export default reducer;
