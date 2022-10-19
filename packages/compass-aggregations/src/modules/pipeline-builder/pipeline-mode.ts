import type { Reducer } from 'redux';
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

export const changePipelineMode = (mode: PipelineMode): PipelineModeToggledAction => ({
  type: ActionTypes.PipelineModeToggled,
  mode,
});

export default reducer;
