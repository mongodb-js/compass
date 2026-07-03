import type { PipelineBuilderThunkAction, RootState } from '..';
import { getStageOperator } from '../../utils/stage';
import type { PipelineBuilder } from './pipeline-builder';
import { loadPreviewForStagesFrom, pipelineFromStore } from './stage-editor';
import type { StoreStage } from './stage-editor';
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
  filterEmptyStageOperators?: true
): string[];
export function getPipelineStageOperatorsFromBuilderState(
  state: RootState,
  filterEmptyStageOperators?: false
): (string | null)[];
export function getPipelineStageOperatorsFromBuilderState(
  state: RootState,
  filterEmptyStageOperators = true
): (string | null)[] {
  const stages =
    state.pipelineBuilder.pipelineMode === 'builder-ui'
      ? state.pipelineBuilder.stageEditor.stages
          .filter(
            (stage): stage is StoreStage =>
              stage.type === 'stage' && !stage.disabled
          )
          .map((stage) => stage.stageOperator)
      : state.pipelineBuilder.textEditor.pipeline.pipeline.map((stage) => {
          return getStageOperator(stage) ?? null;
        });

  return filterEmptyStageOperators ? stages.filter(Boolean) : stages;
}

export function getIsRerankFirstStage(
  state: RootState,
  stageIndex?: number
): boolean {
  // $rerank with no enabled stage preceding it.
  if (stageIndex !== undefined) {
    const stages = state.pipelineBuilder.stageEditor.stages;
    const stage = stages[stageIndex];

    const isRerankStage =
      stage?.type === 'stage' &&
      !stage.disabled &&
      stage.stageOperator === '$rerank';
    const noEnabledStagePrecedes = !stages
      .slice(0, stageIndex)
      .some((s) => s.type === 'stage' && !s.disabled);

    return isRerankStage && noEnabledStagePrecedes;
  }

  // Pipeline-level check (text mode): the parsed pipeline starts with $rerank,
  // or — when syntax errors prevent parsing — the raw text starts with it.
  const { pipeline, syntaxErrors, pipelineText } =
    state.pipelineBuilder.textEditor.pipeline;
  if (pipeline.length > 0) {
    return getStageOperator(pipeline[0]) === '$rerank';
  }
  if (syntaxErrors.length > 0) {
    // Anchored to the structural opening of the pipeline so we don't match
    // $rerank inside string values or comments.
    return /^\s*\[\s*\{\s*\$rerank\b/.test(pipelineText);
  }
  return false;
}

export function getIsRerankFirstStageBannerVisible(
  state: RootState,
  stageIndex?: number
): boolean {
  if (!getIsRerankFirstStage(state, stageIndex)) {
    return false;
  }
  if (stageIndex !== undefined) {
    const stage = state.pipelineBuilder.stageEditor.stages[stageIndex];
    return stage?.type === 'stage' && stage.didReturnDocs;
  }
  const { previewDocs } = state.pipelineBuilder.textEditor.pipeline;
  return previewDocs !== null && previewDocs.length > 0;
}

export function getIsPipelineInvalidFromBuilderState(
  state: RootState,
  includeServerErrors = true
): boolean {
  if (state.pipelineBuilder.pipelineMode === 'builder-ui') {
    return pipelineFromStore(state.pipelineBuilder.stageEditor.stages).some(
      (stage) =>
        !stage.empty &&
        !stage.disabled &&
        (stage.syntaxError || (stage.serverError && includeServerErrors))
    );
  }
  const { serverError, syntaxErrors } =
    state.pipelineBuilder.textEditor.pipeline;
  return Boolean(
    (serverError && includeServerErrors) || syntaxErrors.length > 0
  );
}

export type EditorViewType = 'stage' | 'text' | 'focus';

export function mapPipelineModeToEditorViewType(
  state: RootState
): EditorViewType {
  return state.focusMode.isEnabled
    ? 'focus'
    : state.pipelineBuilder.pipelineMode === 'builder-ui'
    ? 'stage'
    : 'text';
}
