import type { Reducer } from 'redux';
import type { SettingsThunkAction } from '.';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type {
  PreferenceStateInformation,
  UserConfigurablePreferences,
} from 'compass-preferences-model';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-SETTINGS');

export type State = { isModalOpen: boolean } & (
  | {
      loadingState: 'loading';
      settings: Record<string, never>;
      preferenceStates: Record<string, never>;
      updatedFields: never[];
    }
  | {
      loadingState: 'ready';
      settings: UserConfigurablePreferences;
      preferenceStates: PreferenceStateInformation;
      updatedFields: (keyof UserConfigurablePreferences)[];
    }
);

export const INITIAL_STATE: State = {
  isModalOpen: false,
  settings: {},
  preferenceStates: {},
  updatedFields: [],
  loadingState: 'loading',
};

export enum ActionTypes {
  // TODO: based on usage, `fetched` and `synced` should be two different groups
  // of actions, not one
  SettingsFetchedStart = 'compass-settings/SettingsFetchedStart',
  SettingsFetched = 'compass-settings/settingsFetched',
  FieldUpdated = 'compass-settings/settingsFieldUpdated',
  SettingsSaved = 'compass-settings/settingsUpdated',
  OpenSettingsModal = 'compass-settings/OpenSettingsModal',
  CloseSettingsModal = 'compass-settings/CloseSettingsModal',
}

type SettingsFetchedAction = {
  type: ActionTypes.SettingsFetched;
  settings: UserConfigurablePreferences;
  preferenceStates: PreferenceStateInformation;
  updatedFields: (keyof UserConfigurablePreferences)[];
};

type SaveSettingsAction = {
  type: ActionTypes.SettingsSaved;
};

export type Actions = SettingsFetchedAction | SaveSettingsAction;

export const reducer: Reducer<State> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.SettingsFetchedStart:
      return {
        // Updating settings to loading state that is the same as initial one
        ...INITIAL_STATE,
        // ... and preserving current modal state
        isModalOpen: state.isModalOpen,
      };
    case ActionTypes.OpenSettingsModal:
      return {
        ...state,
        isModalOpen: true,
      };
    case ActionTypes.CloseSettingsModal:
      return {
        ...state,
        isModalOpen: false,
      };
    case ActionTypes.SettingsFetched:
      return {
        ...state,
        loadingState: 'ready',
        settings: action.settings,
        preferenceStates: action.preferenceStates,
        updatedFields: action.updatedFields,
      };
    case ActionTypes.SettingsSaved:
      return {
        ...state,
        isModalOpen: false,
      };
    default:
      return state;
  }
};

const syncSandboxStateToStore = (): SettingsThunkAction<Promise<void>> => {
  return async (dispatch, _getState, { preferencesSandbox: sandbox }) => {
    const {
      userPreferences: settings,
      preferenceStates,
      updatedFields,
    } = await sandbox.getSandboxState();

    dispatch({
      type: ActionTypes.SettingsFetched,
      settings,
      preferenceStates,
      updatedFields,
    });
  };
};

export const fetchSettings = (): SettingsThunkAction<Promise<void>> => {
  return async (
    dispatch,
    _getState,
    { preferencesSandbox: sandbox }
  ): Promise<void> => {
    try {
      dispatch({ type: ActionTypes.SettingsFetchedStart });
      await sandbox.setupSandbox();
      await dispatch(syncSandboxStateToStore());
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
): SettingsThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    { preferencesSandbox: sandbox }
  ): Promise<void> => {
    const { loadingState } = getState().settings;
    if (loadingState === 'loading') {
      throw new Error("Can't change preferences while sandbox is being set up");
    }
    await sandbox.updateField(field, value);
    await dispatch(syncSandboxStateToStore());
  };
};

export const openModal = (): SettingsThunkAction<Promise<void>> => {
  return async (dispatch) => {
    dispatch({ type: ActionTypes.OpenSettingsModal });
    await dispatch(fetchSettings());
  };
};

export const closeModal = () => {
  return { type: ActionTypes.CloseSettingsModal };
};

export const saveSettings = (): SettingsThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    { preferencesSandbox: sandbox }
  ): Promise<void> => {
    const { loadingState } = getState().settings;
    if (loadingState === 'loading') {
      throw new Error(
        "Can't update user settings while sandbox is being set up"
      );
    }
    try {
      await sandbox.applySandboxChangesToPreferences();
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
