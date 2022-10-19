import type { RootState } from '..';
import type { PipelineBuilder } from './pipeline-builder';

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
      .map((stage) => stage.stageOperator)
      .filter(Boolean) as string[];
  }
  // TODO
  return [];
}

export function getIsPipelineValidFromBuilderState(state: RootState): boolean {
  if (state.pipelineBuilder.pipelineMode === 'builder-ui') {
    return state.pipelineBuilder.stageEditor.stages.some(
      (stage) => !stage.disabled && (stage.syntaxError || stage.serverError)
    );
  }
  // TODO
  return true;
}
