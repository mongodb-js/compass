import type { Reducer, Dispatch } from 'redux';
import type { RootState } from '.';
import type { ThunkAction } from 'redux-thunk';

import { fetchPreferences, updatePreference } from '../utils/user-preferences';
import type { UserPreferences } from '../utils/user-preferences';

export type State = Partial<UserPreferences>;

const INITIAL_STATE: State = {};

export enum ActionTypes {
  FieldChanged = 'compass-settings/settingsFieldChanged',
  SettingsFetched = 'compass-settings/settingsFetched',
}

type ChangeFieldAction = {
  type: ActionTypes.FieldChanged;
  key: string;
  value: boolean;
};

type SettingsFetchedAction = {
  type: ActionTypes.SettingsFetched;
  settings: UserPreferences;
};

export type Actions =
  | ChangeFieldAction
  | SettingsFetchedAction;

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.SettingsFetched:
      return {
        ...action.settings,
      };
    case ActionTypes.FieldChanged:
      return {
        ...state,
        [action.key]: action.value,
      };
    default:
      return state;
  }
};

export const fetchSettings = (): ThunkAction<void, RootState, void, Actions> => {
  return async (dispatch: Dispatch<Actions>): Promise<void> => {
    try {
      const settings = await fetchPreferences();
      dispatch({
        type: ActionTypes.SettingsFetched,
        settings
      });
    } catch (e) {
      console.error(`Failed to fetch settings: ${(e as Error).message}`);
    }
  };
};

export const changeFieldValue = (field: keyof UserPreferences, value: boolean): ThunkAction<void, RootState, void, Actions> => {
  return async (dispatch: Dispatch<Actions>): Promise<void> => {
    try {
      await updatePreference(field, value);
      dispatch({
        type: ActionTypes.FieldChanged,
        key: field,
        value
      });
    } catch (e) {
      console.error(`Failed to update settings: ${(e as Error).message}`);
    }
  };
};

export default reducer;
