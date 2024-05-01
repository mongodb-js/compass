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

export type NameState = string;

export type IsPipelineLoadedFromExternal = {
  // Used to visually indicate when the pipeline has been loaded
  // from something like the ai generator or pipeline history.
  isPipelineLoadedFromExternal: boolean;
  pipelineLoadedFromExternalId: number;
};

export const INITIAL_STATE: IsPipelineLoadedFromExternal = {
  isPipelineLoadedFromExternal: false,
  pipelineLoadedFromExternalId: 0,
};

/**
 * Reducer function for handle state changes to if the pipeline was loaded
 * from an external source (ai generated or pipeline history).
 */
const reducer: Reducer<IsPipelineLoadedFromExternal> = (
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
    )
  ) {
    return {
      ...state,
      isPipelineLoadedFromExternal: false,
    };
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
    return {
      isPipelineLoadedFromExternal: true,
      pipelineLoadedFromExternalId:
        (state.pipelineLoadedFromExternalId + 1) % Number.MAX_SAFE_INTEGER,
    };
  }
  return state;
};

export default reducer;
