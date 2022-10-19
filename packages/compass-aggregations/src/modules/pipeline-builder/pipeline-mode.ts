import type { Reducer } from 'redux';
import type { PipelineBuilderThunkAction } from '..';
import type { EditorValueChangeAction } from './text-editor';
import { EditorActionTypes as TextEditorActionTypes } from './text-editor';
import type { StagesUpdatedAction } from './stage-editor';
import { StageEditorActionTypes } from './stage-editor';

import { isAction } from '../../utils/is-action';

export type PipelineMode = 'builder-ui' | 'as-text';

export enum ActionTypes {
  PipelineModeToggled = 'compass-aggregations/pipelineModeToggled',
}

export type PipelineModeToggledAction = {
  type: ActionTypes.PipelineModeToggled;
  mode: PipelineMode;
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
): PipelineBuilderThunkAction<void, PipelineModeToggledAction | StagesUpdatedAction | EditorValueChangeAction> => {
  return (dispatch, _getState, { pipelineBuilder }) => {
    // Sync the PipelineBuilder
    if (newMode === 'as-text') {
      pipelineBuilder.stagesToSource();
      dispatch({
        type: TextEditorActionTypes.EditorValueChange,
        pipelineText: pipelineBuilder.source,
        syntaxErrors: pipelineBuilder.syntaxError
      });
    } else {
      pipelineBuilder.sourceToStages();
      dispatch({
        type: StageEditorActionTypes.StagesUpdated,
        stages: pipelineBuilder.stages,
      });
    }

    dispatch({
      type: ActionTypes.PipelineModeToggled,
      mode: newMode,
    });
  }
};

export default reducer;
