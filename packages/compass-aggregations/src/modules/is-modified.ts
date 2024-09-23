import type { ClonePipelineAction } from './clone-pipeline';
import { CLONE_PIPELINE } from './clone-pipeline';
import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import type {
  ChangeStageDisabledAction,
  ChangeStageOperatorAction,
  ChangeStageValueAction,
  StageAddAction,
  StageMoveAction,
  StageRemoveAction,
} from './pipeline-builder/stage-editor';
import { StageEditorActionTypes } from './pipeline-builder/stage-editor';
import type { EditorValueChangeAction } from './pipeline-builder/text-editor-pipeline';
import { EditorActionTypes } from './pipeline-builder/text-editor-pipeline';
import type { SavedPipelineAddAction } from './saved-pipeline';
import { SAVED_PIPELINE_ADD } from './saved-pipeline';
import type {
  LoadGeneratedPipelineAction,
  PipelineGeneratedFromQueryAction,
} from './pipeline-builder/pipeline-ai';
import { AIPipelineActionTypes } from './pipeline-builder/pipeline-ai';
import type { AnyAction } from 'redux';
import { isAction } from '@mongodb-js/compass-utils';

/**
 * Reducer function for handle state changes to isModified.
 */
export default function reducer(state = false, action: AnyAction): boolean {
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
    isAction<PipelineGeneratedFromQueryAction>(
      action,
      AIPipelineActionTypes.PipelineGeneratedFromQuery
    ) ||
    isAction<LoadGeneratedPipelineAction>(
      action,
      AIPipelineActionTypes.LoadGeneratedPipeline
    )
  ) {
    return true;
  }
  if (
    isAction<ClonePipelineAction>(action, CLONE_PIPELINE) ||
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    ) ||
    isAction<SavedPipelineAddAction>(action, SAVED_PIPELINE_ADD)
  ) {
    return false;
  }
  return state;
}
