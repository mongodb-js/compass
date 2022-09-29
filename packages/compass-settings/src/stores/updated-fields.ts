import type { Reducer } from 'redux';
import type { RootState } from '.';
import type { ThunkAction } from 'redux-thunk';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { UserConfigurablePreferences } from 'compass-preferences-model';
import preferences from 'compass-preferences-model';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-SETTINGS');

export type State = Partial<UserConfigurablePreferences>;

const INITIAL_STATE: State = {};

export enum ActionTypes {
  FieldUpdated = 'compass-settings/settingsFieldUpdated',
  SettingsUpdated = 'compass-settings/settingsUpdated',
}

type UpdateFieldAction<K extends keyof UserConfigurablePreferences> = {
  type: ActionTypes.FieldUpdated;
  field: K;
  value: UserConfigurablePreferences[K];
};

type UpdateSettingsAction = {
  type: ActionTypes.SettingsUpdated;
};

export type Actions =
  | UpdateFieldAction<keyof UserConfigurablePreferences>
  | UpdateSettingsAction;

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.FieldUpdated:
      return {
        ...state,
        [action.field]: action.value,
      };
    case ActionTypes.SettingsUpdated:
      return {};
    default:
      return state;
  }
};

export const changeFieldValue = <K extends keyof UserConfigurablePreferences>(
  field: K,
  value: UserConfigurablePreferences[K]
): UpdateFieldAction<K> => ({
  type: ActionTypes.FieldUpdated,
  value,
  field,
});

export const updateSettings = (): ThunkAction<
  Promise<void>,
  RootState,
  void,
  Actions
> => {
  return async (dispatch, getState): Promise<void> => {
    const { updatedFields } = getState();
    try {
      await preferences.savePreferences(updatedFields);
      dispatch({
        type: ActionTypes.SettingsUpdated,
      });
    } catch (e) {
      log.warn(
        mongoLogId(1_001_000_146),
        'Settings',
        'Failed to update settings',
        { message: (e as Error).message }
      );
    }
  };
};

export default reducer;
