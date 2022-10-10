import type { AnyAction, Reducer } from 'redux';
import { NEW_PIPELINE } from './import-pipeline';
import { CLEAR_PIPELINE } from './pipeline';

export const MAX_TIME_MS_CHANGED =
  'aggregations/max-time-ms/MAX_TIME_MS_CHANGED';

type State = null | number;

export const INITIAL_STATE: State = null;

const reducer: Reducer<State, AnyAction> = (state = INITIAL_STATE, action) => {
  if (action.type === MAX_TIME_MS_CHANGED) {
    return action.maxTimeMS;
  }
  if (action.type === NEW_PIPELINE || action.type === CLEAR_PIPELINE) {
    return INITIAL_STATE;
  }
  return state;
}

export const maxTimeMSChanged = (value: number) => ({
  type: MAX_TIME_MS_CHANGED,
  maxTimeMS: isNaN(value) ? null : value
});

export default reducer;
