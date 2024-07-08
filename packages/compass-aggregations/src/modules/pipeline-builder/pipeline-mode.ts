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
import type { RestorePipelineAction } from '../saved-pipeline';
import { RESTORE_PIPELINE } from '../saved-pipeline';
import { AIPipelineActionTypes } from './pipeline-ai';
import type {
  LoadGeneratedPipelineAction,
  PipelineGeneratedFromQueryAction,
} from './pipeline-ai';

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

export type PipelineModeState = PipelineMode;
export type PipelineModeAction = PipelineModeToggledAction;

export const INITIAL_STATE: PipelineModeState = 'builder-ui';

const reducer: Reducer<PipelineModeState> = (state = INITIAL_STATE, action) => {
  if (
    isAction<PipelineModeToggledAction>(action, ActionTypes.PipelineModeToggled)
  ) {
    return action.mode;
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
  return (
    dispatch,
    getState,
    { pipelineBuilder, track, connectionInfoAccess }
  ) => {
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

    track(
      'Editor Type Changed',
      {
        num_stages,
        editor_view_type: mapPipelineModeToEditorViewType(getState()),
      },
      connectionInfoAccess.getCurrentConnectionInfo()
    );

    dispatch(updatePipelinePreview());
  };
};

export default reducer;
