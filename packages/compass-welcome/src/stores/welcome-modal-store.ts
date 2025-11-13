import type AppRegistry from '@mongodb-js/compass-app-registry';
import type { PreferencesAccess } from 'compass-preferences-model';
import type { AnyAction, Reducer } from 'redux';
import type { ThunkAction } from 'redux-thunk';

export type WelcomeModalState = {
  isOpen: boolean;
};

export type WelcomeModalThunkAction<
  R,
  A extends AnyAction = AnyAction
> = ThunkAction<
  R,
  WelcomeModalState,
  { preferences: PreferencesAccess; globalAppRegistry: AppRegistry },
  A
>;

enum WelcomeModalActionTypes {
  ModalClosed = 'compass-welcome/welcome-modal/ModalClosed',
  OpenSettingsClicked = 'compass-welcome/welcome-modal/OpenSettingsClicked',
}

export const closeModal = (): WelcomeModalThunkAction<void> => {
  return (dispatch, _getState, { preferences }) => {
    void preferences.savePreferences({ showedNetworkOptIn: true });
    dispatch({ type: WelcomeModalActionTypes.ModalClosed });
  };
};

export const openSettings = (): WelcomeModalThunkAction<void> => {
  return (dispatch, _getState, { preferences, globalAppRegistry }) => {
    void preferences.savePreferences({ showedNetworkOptIn: true });
    dispatch({ type: WelcomeModalActionTypes.OpenSettingsClicked });
    globalAppRegistry.emit('open-compass-settings', 'privacy');
  };
};

const reducer: Reducer<WelcomeModalState> = (
  state = { isOpen: false },
  action
) => {
  if (
    action.type === WelcomeModalActionTypes.ModalClosed ||
    action.type === WelcomeModalActionTypes.OpenSettingsClicked
  ) {
    return { isOpen: false };
  }
  return state;
};

export default reducer;
