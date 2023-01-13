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
  state: RootState,
  filterEmptyStageOperators?: true,
): string[];
export function getPipelineStageOperatorsFromBuilderState(
  state: RootState,
  filterEmptyStageOperators?: false
): (string | null)[];
export function getPipelineStageOperatorsFromBuilderState(
  state: RootState,
  filterEmptyStageOperators = true
): (string | null)[] | string[] {
  const stages = state.pipelineBuilder.pipelineMode === 'builder-ui'
    ? state.pipelineBuilder.stageEditor.stages
      .filter((stage) => !stage.disabled)
      .map((stage) => stage.stageOperator)
    : state.pipelineBuilder.textEditor.pipeline.pipeline
      .map((stage) => {
        return getStageOperator(stage) ?? null;
      });

  return filterEmptyStageOperators ? stages.filter(Boolean) : stages;
}

export function getIsPipelineInvalidFromBuilderState(
  state: RootState,
  includeServerErrors = true,
): boolean {
  if (state.pipelineBuilder.pipelineMode === 'builder-ui') {
    return state.pipelineBuilder.stageEditor.stages.some(
      (stage) =>
        !stage.empty &&
        !stage.disabled &&
        (stage.syntaxError || (stage.serverError && includeServerErrors))
    );
  }
  const { serverError, syntaxErrors } = state.pipelineBuilder.textEditor.pipeline;
  return Boolean((serverError && includeServerErrors) || syntaxErrors.length > 0);
}

export type EditorViewType = 'stage' | 'text';
export function mapPipelineModeToEditorViewType(mode: PipelineMode): EditorViewType {
  return mode === 'builder-ui' ? 'stage' : 'text';
}