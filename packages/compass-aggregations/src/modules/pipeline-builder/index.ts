import type { Reducer } from 'redux';
import { combineReducers } from 'redux';
import type { Stage } from './pipeline-builder';
import { PipelineStorage } from '../../utils/pipeline-storage';
import type { PipelineBuilderThunkAction } from './util';
import type { StageEditorState } from './stage-editor';
import { loadStagePreview } from './stage-editor';
import stageEditor from './stage-editor';

export const PIPELINE_INIT = 'PIPELINE_INIT';

export type PipelineInitAction = {
  type: typeof PIPELINE_INIT;
  stages: Stage[];
  source: string;
};

export const PIPELINE_RESET = 'PIPELINE_RESET';

export type PipelineResetAction = {
  type: typeof PIPELINE_RESET;
  stages: Stage[];
  source: string;
};

export const PIPELINE_LOAD = 'PIPELINE_LOAD';

export type PipelineLoadAction = {
  type: typeof PIPELINE_LOAD;
  stages: Stage[];
  source: string;
};

export const PIPELINE_LOAD_ERROR = 'PIPELINE_LOAD_ERROR';

export type PipelineLoadErrorAction = {
  type: typeof PIPELINE_LOAD_ERROR;
  error: Error;
};

export const initPipeline = (): PipelineBuilderThunkAction<
  void,
  PipelineInitAction
> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    dispatch({
      type: PIPELINE_INIT,
      stages: pipelineBuilder.stages,
      source: pipelineBuilder.source
    });
  };
};

export const resetPipeline = (newSource?: string): PipelineBuilderThunkAction<
  void,
  PipelineResetAction
> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    pipelineBuilder.resetSource(newSource);
    dispatch({
      type: PIPELINE_RESET,
      stages: pipelineBuilder.stages,
      source: pipelineBuilder.source
    });
  };
};

export const loadPipeline = (
  id: string
): PipelineBuilderThunkAction<
  Promise<void>,
  PipelineLoadAction | PipelineLoadErrorAction
> => {
  return async (dispatch, getState, { pipelineBuilder }) => {
    try {
      const savedPipelineItem = await new PipelineStorage().load(id);
      pipelineBuilder.resetSource(savedPipelineItem.pipelineText as string);
      dispatch({
        type: PIPELINE_LOAD,
        stages: pipelineBuilder.stages,
        source: pipelineBuilder.source
      });
      // TODO: do a different one based on view type if (getState().viewType === ...)
      getState().pipelineBuilder.stageEditor.stages.forEach((_, idx) => {
        void dispatch(loadStagePreview(idx));
      });
    } catch (err) {
      dispatch({
        type: PIPELINE_LOAD_ERROR,
        error: err as Error
      });
    }
  };
};

type PipelineBuilderState = {
  // viewType: 'text' | 'stage-by-stage';
  stageEditor: StageEditorState;
};

const reducer: Reducer<PipelineBuilderState> = combineReducers({
  stageEditor: stageEditor
});

export { PipelineBuilder } from './pipeline-builder';

export default reducer;
