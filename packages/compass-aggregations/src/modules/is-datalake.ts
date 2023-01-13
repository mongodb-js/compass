import type { Reducer } from 'redux';

type State = boolean;

export const INITIAL_STATE: State = false;

const reducer: Reducer<State> = (state = INITIAL_STATE) => {
  return state;
};

export default reducer;