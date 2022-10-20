import type { Reducer } from 'redux';
import type { PipelineBuilderThunkAction } from '..';
import { changeEditorValue } from './text-editor';
import { changeStages } from './stage-editor';
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
): PipelineBuilderThunkAction<void, PipelineModeToggledAction> => {
  return (dispatch, _getState, { pipelineBuilder }) => {
    // Sync the PipelineBuilder
    if (newMode === 'as-text') {
      pipelineBuilder.stagesToSource();
      dispatch(changeEditorValue(
        pipelineBuilder.getPipelineStringFromStages()
      ));
    } else {
      pipelineBuilder.sourceToStages();
      dispatch(changeStages(pipelineBuilder.stages));
    }

    // Toggle the view (and state)
    dispatch({
      type: ActionTypes.PipelineModeToggled,
      mode: newMode,
    });
  }
};

export default reducer;
