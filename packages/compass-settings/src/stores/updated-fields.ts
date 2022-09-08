import type { Reducer } from 'redux';
import type { RootState } from '.';
import type { ThunkAction } from 'redux-thunk';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { UserPreferences } from 'compass-preferences-model';
import ipc from 'hadron-ipc';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-SETTINGS');

export type State = Partial<UserPreferences>;

const INITIAL_STATE: State = {};

export enum ActionTypes {
  FieldUpdated = 'compass-settings/settingsFieldUpdated',
  SettingsUpdated = 'compass-settings/settingsUpdated',
}

type UpdateFieldAction = {
  type: ActionTypes.FieldUpdated;
  field: string;
  value: boolean | string;
};

type UpdateSettingsAction = {
  type: ActionTypes.SettingsUpdated;
};

export type Actions = UpdateFieldAction | UpdateSettingsAction;

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

export const changeFieldValue = (
  field: keyof UserPreferences,
  value: string | boolean
): UpdateFieldAction => ({
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
      await ipc.ipcRenderer.invoke('compass:save-preferences', updatedFields);
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
