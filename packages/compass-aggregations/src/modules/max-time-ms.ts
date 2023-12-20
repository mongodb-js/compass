import type { Reducer } from 'redux';
import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model/provider';
import { isAction } from '../utils/is-action';

export const MAX_TIME_MS_CHANGED =
  'aggregations/max-time-ms/MAX_TIME_MS_CHANGED' as const;
export const PREFERENCES_MAX_TIME_MS_CHANGED =
  'aggregations/max-time-ms/PREFERENCES_MAX_TIME_MS_CHANGED' as const;
export interface MaxTimeMSChangedAction {
  type: typeof MAX_TIME_MS_CHANGED;
  maxTimeMS: number | null;
}
export interface PreferencesMaxTimeMSChangedAction {
  type: typeof PREFERENCES_MAX_TIME_MS_CHANGED;
  maxTimeMS: number | null;
}

type State = {
  current: number | null;
  preferencesValue: number | null;
};

export const INITIAL_STATE: State = { current: null, preferencesValue: null };

const reducer: Reducer<State> = (state = INITIAL_STATE, action) => {
  if (isAction<MaxTimeMSChangedAction>(action, MAX_TIME_MS_CHANGED)) {
    return {
      current: capMaxTimeMSAtPreferenceLimit(
        {
          getPreferences: () => ({
            maxTimeMS: state.preferencesValue ?? undefined,
          }),
        },
        action.maxTimeMS
      ),
      preferencesValue: state.preferencesValue,
    };
  }
  if (
    isAction<PreferencesMaxTimeMSChangedAction>(
      action,
      PREFERENCES_MAX_TIME_MS_CHANGED
    )
  ) {
    return {
      current: capMaxTimeMSAtPreferenceLimit(
        {
          getPreferences: () => ({ maxTimeMS: action.maxTimeMS ?? undefined }),
        },
        state.current
      ),
      preferencesValue: action.maxTimeMS,
    };
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

export const maxTimeMSChanged = (value: number) => ({
  type: MAX_TIME_MS_CHANGED,
  maxTimeMS: isNaN(value) ? null : value,
});

export const preferencesMaxTimeMSChanged = (value: number | undefined) => ({
  type: PREFERENCES_MAX_TIME_MS_CHANGED,
  maxTimeMS: value ?? null,
});

export default reducer;
