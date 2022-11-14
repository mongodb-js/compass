import type { PipelineBuilderThunkAction, RootState } from '..';
import { getStageOperator } from '../../utils/stage';
import type { PipelineBuilder } from './pipeline-builder';
import type { PipelineMode } from './pipeline-mode';
import { loadPreviewForStagesFrom } from './stage-editor';
import { loadPreviewForPipeline } from './text-editor-pipeline';

export const updatePipelinePreview =
  (): PipelineBuilderThunkAction<void> =>
    (dispatch, getState, { pipelineBuilder }) => {
      // Stop unconditionally (we might not start again based on the autoPreview
      // state and stages validity)
      pipelineBuilder.stopPreview();

      if (getState().pipelineBuilder.pipelineMode === 'builder-ui') {
        dispatch(loadPreviewForStagesFrom(0));
      } else {
        void dispatch(loadPreviewForPipeline());
      }
    };

export function getStagesFromBuilderState(
  state: RootState,
  pipelineBuilder: PipelineBuilder
) {
  if (state.pipelineBuilder.pipelineMode === 'builder-ui') {
    return pipelineBuilder.stages.map((stage) => stage.toBSON());
  } else {
    return pipelineBuilder.getPipelineFromSource();
  }
}

export function getPipelineFromBuilderState(
  state: RootState,
  pipelineBuilder: PipelineBuilder
) {
  if (state.pipelineBuilder.pipelineMode === 'builder-ui') {
    return pipelineBuilder.getPipelineFromStages();
  } else {
    return pipelineBuilder.getPipelineFromSource();
  }
}

export function getPipelineStringFromBuilderState(
  state: RootState,
  pipelineBuilder: PipelineBuilder
): string {
  if (state.pipelineBuilder.pipelineMode === 'builder-ui') {
    return pipelineBuilder.getPipelineStringFromStages();
  } else {
    return pipelineBuilder.getPipelineStringFromSource();
  }
}

export function getPipelineStageOperatorsFromBuilderState(
  state: RootState
): string[] {
  if (state.pipelineBuilder.pipelineMode === 'builder-ui') {
    return state.pipelineBuilder.stageEditor.stages
      .filter((stage) => !stage.disabled)
      .map((stage) => stage.stageOperator)
      .filter(Boolean) as string[];
  }
  return state.pipelineBuilder.textEditor.pipeline.pipeline
    .map((stage) => {
      return getStageOperator(stage);
    })
    .filter(Boolean) as string[];
}

export function getIsPipelineInvalidFromBuilderState(
  state: RootState,
  includeServerErrors = true,
): boolean {
  if (state.pipelineBuilder.pipelineMode === 'builder-ui') {
    return state.pipelineBuilder.stageEditor.stages.some(
      (stage) => !stage.disabled && (stage.syntaxError || (stage.serverError && includeServerErrors))
    );
  }
  const { serverError, syntaxErrors } = state.pipelineBuilder.textEditor.pipeline;
  return Boolean((serverError && includeServerErrors) || syntaxErrors.length > 0);
}

export type EditorViewType = 'stage' | 'text';
export function mapPipelineModeToEditorViewType(mode: PipelineMode): EditorViewType {
  return mode === 'builder-ui' ? 'stage' : 'text';
}