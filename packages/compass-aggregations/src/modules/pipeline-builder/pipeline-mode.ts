import type { Reducer } from 'redux';

export type PipelineMode = 'builder-ui' | 'as-text';

export enum ActionTypes {
  PipelineModeToggled = 'compass-aggregations/pipelineModeToggled',
}

export type PipelineModeToggledAction = {
  type: ActionTypes.PipelineModeToggled;
  mode: PipelineMode;
};

type State = PipelineMode;
type Actions = PipelineModeToggledAction;

export const INITIAL_STATE: State = 'builder-ui';

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  if (action.type === ActionTypes.PipelineModeToggled) {
    return action.mode;
  }
  return state;
};

export const changePipelineMode = (mode: PipelineMode): PipelineModeToggledAction => ({
  type: ActionTypes.PipelineModeToggled,
  mode,
});

export default reducer;
