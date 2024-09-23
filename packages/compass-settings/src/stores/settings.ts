import type { Action, Reducer } from 'redux';
import type { SettingsThunkAction } from '.';
import type {
  PreferenceStateInformation,
  UserConfigurablePreferences,
} from 'compass-preferences-model';
import { cancelAtlasLoginAttempt } from './atlas-login';
import { isAction } from '@mongodb-js/compass-utils';

export type SettingsTabId =
  | 'general'
  | 'theme'
  | 'privacy'
  | 'oidc'
  | 'ai'
  | 'proxy'
  | 'preview';

export type State = { isModalOpen: boolean; tab: undefined | SettingsTabId } & (
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
  tab: undefined,
};

export enum ActionTypes {
  // TODO(COMPASS-7098): based on usage, `fetched` and `synced` should be two
  // different groups of actions, not one
  SettingsFetchedStart = 'compass-settings/SettingsFetchedStart',
  SettingsFetched = 'compass-settings/settingsFetched',
  ChangeFieldValue = 'compass-settings/ChangeFieldValue',
  FieldUpdated = 'compass-settings/settingsFieldUpdated',
  SettingsSaved = 'compass-settings/settingsUpdated',
  OpenSettingsModal = 'compass-settings/OpenSettingsModal',
  SelectTab = 'compass-settings/SelectTab',
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

type SettingsFetchStartAction = {
  type: ActionTypes.SettingsFetchedStart;
};

type OpenSettingsModalAction = {
  type: ActionTypes.OpenSettingsModal;
  tab?: SettingsTabId;
};

type SelectTabAction = {
  type: ActionTypes.SelectTab;
  tab?: SettingsTabId;
};

type CloseSettingsModalAction = {
  type: ActionTypes.CloseSettingsModal;
};

type ChangeFieldValueAction<K extends keyof UserConfigurablePreferences> = {
  type: ActionTypes.ChangeFieldValue;
  field: K;
  value: UserConfigurablePreferences[K];
};

export const reducer: Reducer<State, Action> = (
  state = INITIAL_STATE,
  action
): State => {
  if (
    isAction<SettingsFetchStartAction>(action, ActionTypes.SettingsFetchedStart)
  ) {
    return {
      // Updating settings to loading state that is the same as initial one
      ...INITIAL_STATE,
      // ... and preserving current modal state
      isModalOpen: state.isModalOpen,
      tab: state.tab,
    };
  }
  if (
    isAction<OpenSettingsModalAction>(action, ActionTypes.OpenSettingsModal)
  ) {
    return {
      ...state,
      isModalOpen: true,
      tab: action.tab,
    };
  }
  if (isAction<SelectTabAction>(action, ActionTypes.SelectTab)) {
    return {
      ...state,
      tab: action.tab ?? state.tab,
    };
  }
  if (
    isAction<CloseSettingsModalAction>(action, ActionTypes.CloseSettingsModal)
  ) {
    return {
      ...state,
      isModalOpen: false,
    };
  }
  if (
    isAction<ChangeFieldValueAction<keyof UserConfigurablePreferences>>(
      action,
      ActionTypes.ChangeFieldValue
    )
  ) {
    if (state.loadingState !== 'ready') return state;
    return {
      ...state,
      settings: {
        ...state.settings,
        [action.field]: action.value,
      },
    };
  }
  if (isAction<SettingsFetchedAction>(action, ActionTypes.SettingsFetched)) {
    return {
      ...state,
      loadingState: 'ready',
      settings: action.settings,
      preferenceStates: action.preferenceStates,
      updatedFields: action.updatedFields,
    };
  }
  if (isAction<SaveSettingsAction>(action, ActionTypes.SettingsSaved)) {
    return {
      ...state,
      isModalOpen: false,
    };
  }
  return state;
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

export const fetchSettings = (): SettingsThunkAction<
  Promise<void>,
  SettingsFetchStartAction
> => {
  return async (
    dispatch,
    _getState,
    { preferencesSandbox: sandbox, logger }
  ): Promise<void> => {
    try {
      dispatch({ type: ActionTypes.SettingsFetchedStart });
      await sandbox.setupSandbox();
      await dispatch(syncSandboxStateToStore());
    } catch (e) {
      logger.log.warn(
        logger.mongoLogId(1_001_000_145),
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
): SettingsThunkAction<Promise<void>, ChangeFieldValueAction<K>> => {
  return async (
    dispatch,
    getState,
    { preferencesSandbox: sandbox, logger }
  ): Promise<void> => {
    const { loadingState } = getState().settings;
    if (loadingState === 'loading') {
      throw new Error("Can't change preferences while sandbox is being set up");
    }
    // User input component should always be in sync with user input while user
    // is typing, otherwise it can cause unexpected behavior of the DOM input
    // node and React component. We make sure value is in sync by first updating
    // state with whatever user typed with a `ChangeFieldValue` action ...
    dispatch({ type: ActionTypes.ChangeFieldValue, field, value });
    try {
      // ... we then follow up by updating field value in the preferences. This
      // can fail if user input doesn't pass validation.
      await sandbox.updateField(field, value);
    } catch (err) {
      logger.log.error(
        logger.mongoLogId(1_001_000_223),
        'Settings',
        'Failed to change settings value',
        { error: (err as Error).stack }
      );
    }
    // Sync state from sandbox whether or not update failed so that we are back
    // to the actual preferences state input instead of whatever user has typed
    await dispatch(syncSandboxStateToStore());
  };
};

export const openModal = (
  tab?: SettingsTabId
): SettingsThunkAction<Promise<void>, OpenSettingsModalAction> => {
  return async (dispatch) => {
    dispatch({ type: ActionTypes.OpenSettingsModal, tab });
    await dispatch(fetchSettings());
  };
};

export const selectTab = (tab?: SettingsTabId): SelectTabAction => {
  return { type: ActionTypes.SelectTab, tab };
};

export const closeModal = (): SettingsThunkAction<
  void,
  CloseSettingsModalAction
> => {
  return (dispatch) => {
    dispatch(cancelAtlasLoginAttempt());
    dispatch({ type: ActionTypes.CloseSettingsModal });
  };
};

export const saveSettings = (): SettingsThunkAction<
  Promise<void>,
  SaveSettingsAction
> => {
  return async (
    dispatch,
    getState,
    { preferencesSandbox: sandbox, logger }
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
      logger.log.warn(
        logger.mongoLogId(1_001_000_146),
        'Settings',
        'Failed to update settings',
        { message: (e as Error).message }
      );
    }
  };
};
