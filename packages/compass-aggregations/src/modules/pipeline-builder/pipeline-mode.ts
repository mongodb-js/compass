import type { Reducer } from 'redux';
import type { Document } from 'mongodb';
import type { PipelineBuilderThunkAction } from '..';
import { isAction } from '../../utils/is-action';
import { getPipelineFromBuilderState, mapPipelineModeToEditorViewType, updatePipelinePreview } from './builder-helpers';
import type Stage from './stage';
import type { PipelineParserError } from './pipeline-parser/utils';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

export type PipelineMode = 'builder-ui' | 'as-text';

export enum ActionTypes {
  PipelineModeToggled = 'compass-aggregations/pipelineModeToggled',
}

export type PipelineModeToggledAction = {
  type: ActionTypes.PipelineModeToggled;
  mode: PipelineMode;
  pipelineText: string;
  pipeline: Document[] | null;
  syntaxErrors: PipelineParserError[];
  stages: Stage[];
};

type State = PipelineMode;

export const INITIAL_STATE: State = 'builder-ui';

const reducer: Reducer<State> = (state = INITIAL_STATE, action) => {
  if (isAction<PipelineModeToggledAction>(
    action,
    ActionTypes.PipelineModeToggled
  )) {
    return action.mode;
  }
  return state;
};

export const changePipelineMode = (
  newMode: PipelineMode
): PipelineBuilderThunkAction<void, PipelineModeToggledAction> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    // Sync the PipelineBuilder
    if (newMode === 'as-text') {
      pipelineBuilder.stagesToSource();
    } else {
      pipelineBuilder.sourceToStages();
    }

    const num_stages = getPipelineFromBuilderState(getState(), pipelineBuilder).length;
    track('Editor Type Changed', {
      num_stages,
      editor_view_type: mapPipelineModeToEditorViewType(newMode),
    });

    dispatch({
      type: ActionTypes.PipelineModeToggled,
      mode: newMode,
      pipelineText: pipelineBuilder.source,
      pipeline: pipelineBuilder.pipeline,
      syntaxErrors: pipelineBuilder.syntaxError,
      stages: pipelineBuilder.stages,
    });

    dispatch(updatePipelinePreview());
  }
};

export default reducer;
