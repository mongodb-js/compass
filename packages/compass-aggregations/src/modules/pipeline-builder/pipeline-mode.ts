import type { Reducer } from 'redux';
import type { Document } from 'mongodb';
import type { PipelineBuilderThunkAction } from '..';
import { isAction } from '../../utils/is-action';
import {
  getPipelineFromBuilderState,
  mapPipelineModeToEditorViewType,
  updatePipelinePreview,
} from './builder-helpers';
import type Stage from './stage';
import type { PipelineParserError } from './pipeline-parser/utils';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { RESTORE_PIPELINE } from '../saved-pipeline';
import { AIPipelineActionTypes } from './pipeline-ai';
import type { LoadNewPipelineAction } from './pipeline-ai';

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
  if (
    isAction<PipelineModeToggledAction>(action, ActionTypes.PipelineModeToggled)
  ) {
    return action.mode;
  }
  if (
    action.type === RESTORE_PIPELINE ||
    isAction<LoadNewPipelineAction>(
      action,
      AIPipelineActionTypes.LoadNewPipeline
    )
  ) {
    // Force as-text editor mode if loaded pipeline contains syntax errors
    if (action.syntaxErrors.length > 0) {
      return 'as-text';
    }
  }
  return state;
};

export const changePipelineMode = (
  newMode: PipelineMode
): PipelineBuilderThunkAction<void, PipelineModeToggledAction> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    if (newMode === getState().pipelineBuilder.pipelineMode) {
      return;
    }

    // Sync the PipelineBuilder
    if (newMode === 'as-text') {
      pipelineBuilder.stagesToSource();
    } else {
      pipelineBuilder.sourceToStages();
    }

    dispatch({
      type: ActionTypes.PipelineModeToggled,
      mode: newMode,
      pipelineText: pipelineBuilder.source,
      pipeline: pipelineBuilder.pipeline,
      syntaxErrors: pipelineBuilder.syntaxError,
      stages: pipelineBuilder.stages,
    });

    const num_stages = getPipelineFromBuilderState(
      getState(),
      pipelineBuilder
    ).length;

    track('Editor Type Changed', {
      num_stages,
      editor_view_type: mapPipelineModeToEditorViewType(getState()),
    });

    dispatch(updatePipelinePreview());
  };
};

export default reducer;
