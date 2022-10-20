import type { Reducer } from 'redux';
import type { PipelineBuilderThunkAction } from '..';
import { isAction } from '../../utils/is-action';
import { updatePipelinePreview } from './builder-helpers';
import type Stage from './stage';
import type { PipelineParserError } from './pipeline-parser/utils';

export type PipelineMode = 'builder-ui' | 'as-text';

export enum ActionTypes {
  PipelineModeToggled = 'compass-aggregations/pipelineModeToggled',
}

export type PipelineModeToggledAction = {
  type: ActionTypes.PipelineModeToggled;
  mode: PipelineMode;
  pipelineText: string;
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
  return (dispatch, _getState, { pipelineBuilder }) => {
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
      syntaxErrors: pipelineBuilder.syntaxError,
      stages: pipelineBuilder.stages,
    });

    dispatch(updatePipelinePreview());
  }
};

export default reducer;
