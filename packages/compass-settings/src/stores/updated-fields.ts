import type { Reducer } from 'redux';
import type { RootState } from '.';
import type { ThunkAction } from 'redux-thunk';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-SETTINGS');

import { updatePreferences } from '../utils/user-preferences';
import type { UserPreferences } from '../utils/user-preferences';

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
      await updatePreferences(updatedFields);
      dispatch({
        type: ActionTypes.SettingsUpdated,
      });
    } catch (e) {
      log.warn(
        mongoLogId(1_001_000_142),
        'Settings',
        'Failed to update settings',
        { message: (e as Error).message }
      );
    }
  };
};

export default reducer;
