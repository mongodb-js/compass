import type { Reducer } from 'redux';
import type { RootState } from '.';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type {
  PreferenceStateInformation,
  UserConfigurablePreferences,
  PreferencesAccess,
} from 'compass-preferences-model';
import preferences from 'compass-preferences-model';
import { pick } from '../utils/pick';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-SETTINGS');

export type State =
  | {
      loadingState: 'loading';
      sandbox: null;
      settings: Record<string, never>;
      preferenceStates: Record<string, never>;
      updatedFields: never[];
    }
  | {
      loadingState: 'ready';
      sandbox: PreferencesAccess;
      settings: UserConfigurablePreferences;
      preferenceStates: PreferenceStateInformation;
      updatedFields: (keyof UserConfigurablePreferences)[];
    };

export const INITIAL_STATE: State = {
  sandbox: null,
  settings: {},
  preferenceStates: {},
  updatedFields: [],
  loadingState: 'loading',
};

export enum ActionTypes {
  SettingsFetched = 'compass-settings/settingsFetched',
  FieldUpdated = 'compass-settings/settingsFieldUpdated',
  SettingsSaved = 'compass-settings/settingsUpdated',
}

type SettingsFetchedAction = {
  type: ActionTypes.SettingsFetched;
  sandbox: PreferencesAccess;
  settings: UserConfigurablePreferences;
  preferenceStates: PreferenceStateInformation;
  updatedFields: (keyof UserConfigurablePreferences)[];
};

type SaveSettingsAction = {
  type: ActionTypes.SettingsSaved;
};

export type Actions = SettingsFetchedAction | SaveSettingsAction;

export const reducer: Reducer<State, Actions> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case ActionTypes.SettingsFetched:
      return {
        loadingState: 'ready',
        sandbox: action.sandbox,
        settings: action.settings,
        preferenceStates: action.preferenceStates,
        updatedFields: action.updatedFields,
      };
    case ActionTypes.SettingsSaved:
      return {
        ...state,
        updatedFields: [],
      };
    default:
      return state;
  }
};

async function dispatchSandboxUpdate(
  dispatch: ThunkDispatch<{ settings: State }, void, Actions>,
  sandbox: PreferencesAccess
): Promise<void> {
  const [settings, preferenceStates] = await Promise.all([
    sandbox.getConfigurableUserPreferences(),
    sandbox.getPreferenceStates(),
  ]);
  const updatedFields = (
    Object.keys(settings) as (keyof typeof settings)[]
  ).filter(
    (k) =>
      settings[k] !== preferences.getPreferences()[k] &&
      preferenceStates[k] === undefined
  );

  dispatch({
    type: ActionTypes.SettingsFetched,
    sandbox,
    settings,
    preferenceStates,
    updatedFields,
  });
}

export const fetchSettings = (): ThunkAction<
  Promise<void>,
  RootState,
  void,
  Actions
> => {
  return async (dispatch): Promise<void> => {
    try {
      const sandbox = await preferences.createSandbox();
      await dispatchSandboxUpdate(dispatch, sandbox);
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

export const changeFieldValue = <K extends keyof UserConfigurablePreferences>(
  field: K,
  value: UserConfigurablePreferences[K]
): ThunkAction<Promise<void>, RootState, void, Actions> => {
  return async (dispatch, getState): Promise<void> => {
    const { loadingState, sandbox } = getState().settings;
    if (loadingState === 'loading') return;
    await sandbox.savePreferences({ [field]: value });
    await dispatchSandboxUpdate(dispatch, sandbox);
  };
};

export const saveSettings = (): ThunkAction<
  Promise<void>,
  RootState,
  void,
  Actions
> => {
  return async (dispatch, getState): Promise<void> => {
    const { loadingState, sandbox, updatedFields } = getState().settings;
    if (loadingState === 'loading') return;
    try {
      const values = await sandbox.getConfigurableUserPreferences();
      await preferences.savePreferences(pick(values, updatedFields));
      dispatch({
        type: ActionTypes.SettingsSaved,
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
