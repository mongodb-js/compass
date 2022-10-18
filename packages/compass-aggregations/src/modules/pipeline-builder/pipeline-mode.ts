import type { Reducer } from 'redux';

type PipelineMode = 'builder-ui';

type State = PipelineMode;

export const INITIAL_STATE: State = 'builder-ui';

const reducer: Reducer<State> = (state = INITIAL_STATE) => {
  return state;
};

export default reducer;
