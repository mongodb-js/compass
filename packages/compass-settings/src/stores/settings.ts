import type { Reducer } from 'redux';
import type { RootState } from '.';
import type { ThunkAction } from 'redux-thunk';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { preferences } from 'compass-preferences-model';
import type { UserPreferences } from 'compass-preferences-model';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-SETTINGS');

import { ActionTypes as UpdatedFieldActionTypes } from './updated-fields';
import type { Actions as UpdatedFieldActions } from './updated-fields';

export type State = Partial<UserPreferences>;

const INITIAL_STATE: State = {};

export enum ActionTypes {
  SettingsFetched = 'compass-settings/settingsFetched',
}

type SettingsFetchedAction = {
  type: ActionTypes.SettingsFetched;
  settings: UserPreferences;
};

export type Actions = SettingsFetchedAction;

const reducer: Reducer<State, Actions | UpdatedFieldActions> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case ActionTypes.SettingsFetched:
      return {
        ...action.settings,
      };
    case UpdatedFieldActionTypes.FieldUpdated:
      return {
        ...state,
        [action.field]: action.value,
      };
    default:
      return state;
  }
};

export const fetchSettings = (): ThunkAction<
  void,
  RootState,
  void,
  Actions
> => {
  return (dispatch): void => {
    try {
      const settings = preferences.getConfigurableUserPreferences();

      // Not a first time user. Return saved preferences
      if (settings.showedNetworkOptIn) {
        dispatch({
          type: ActionTypes.SettingsFetched,
          settings,
        });
      }
    } catch (e) {
      log.warn(
        mongoLogId(1_001_000_145),
        'Settings',
        'Failed to fetch settings',
        { message: (e as Error).message }
      );
    }
  };
};

export default reducer;
