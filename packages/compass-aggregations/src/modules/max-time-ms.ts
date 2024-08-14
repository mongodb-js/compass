import type { Action, Reducer } from 'redux';
import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model/provider';
import { isAction } from '../utils/is-action';
import type { PipelineBuilderThunkAction } from '.';

export const MAX_TIME_MS_CHANGED =
  'aggregations/max-time-ms/MAX_TIME_MS_CHANGED' as const;
export interface MaxTimeMSChangedAction {
  type: typeof MAX_TIME_MS_CHANGED;
  maxTimeMS: number;
}

type State = number | null;

export const INITIAL_STATE: State = null;

const reducer: Reducer<State, Action> = (state = INITIAL_STATE, action) => {
  if (isAction<MaxTimeMSChangedAction>(action, MAX_TIME_MS_CHANGED)) {
    return action.maxTimeMS;
  }
  if (
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    )
  ) {
    return INITIAL_STATE;
  }
  return state;
};

export const maxTimeMSChanged = (
  value: number | null
): PipelineBuilderThunkAction<void> => {
  return (dispatch, _getState, { preferences }) => {
    const maxTimeMS = capMaxTimeMSAtPreferenceLimit(preferences, value);
    dispatch({
      type: MAX_TIME_MS_CHANGED,
      maxTimeMS,
    });
  };
};

export default reducer;
