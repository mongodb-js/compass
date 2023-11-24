import type { Reducer } from 'redux';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model';
import type { RootAction } from '.';

export const MAX_TIME_MS_CHANGED =
  'aggregations/max-time-ms/MAX_TIME_MS_CHANGED' as const;
export interface MaxTimeMSChangedAction {
  type: typeof MAX_TIME_MS_CHANGED;
  maxTimeMS: number | null;
}

type State = null | number;

export const INITIAL_STATE: State = null;

const reducer: Reducer<State, RootAction> = (state = INITIAL_STATE, action) => {
  if (action.type === MAX_TIME_MS_CHANGED) {
    return capMaxTimeMSAtPreferenceLimit(action.maxTimeMS);
  }
  if (action.type === ConfirmNewPipelineActions.NewPipelineConfirmed) {
    return INITIAL_STATE;
  }
  return state;
};

export const maxTimeMSChanged = (value: number) => ({
  type: MAX_TIME_MS_CHANGED,
  maxTimeMS: isNaN(value) ? null : value,
});

export default reducer;
