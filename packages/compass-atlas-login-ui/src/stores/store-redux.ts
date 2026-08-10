import { createStore, applyMiddleware } from 'redux';
import type { AnyAction } from 'redux';
import thunk from 'redux-thunk';
import type { ThunkAction } from 'redux-thunk';
import {
  ConfirmationModalVariant,
  openToast,
  showConfirmation,
} from '@mongodb-js/compass-components';
import type {
  AtlasAuthService,
  AtlasUserInfo,
} from '@mongodb-js/atlas-service/provider';

const DISCONNECT_TOAST_ID = 'atlas-disconnected';
const CONNECTED_TOAST_ID = 'atlas-connected';

export type AtlasLoginState = {
  userInfo: AtlasUserInfo | null;
};

const INITIAL_STATE: AtlasLoginState = {
  userInfo: null,
};

export const AtlasLoginActionTypes = {
  UserInfoChanged: 'compass-atlas-login-ui/UserInfoChanged',
} as const;

type UserInfoChangedAction = {
  type: typeof AtlasLoginActionTypes.UserInfoChanged;
  userInfo: AtlasUserInfo | null;
};

export type AtlasLoginThunkExtraArg = {
  atlasAuthService: AtlasAuthService;
};

export type AtlasLoginThunkAction<
  R,
  A extends AnyAction = AnyAction
> = ThunkAction<R, AtlasLoginState, AtlasLoginThunkExtraArg, A>;

function reducer(
  state: AtlasLoginState = INITIAL_STATE,
  action: AnyAction
): AtlasLoginState {
  if (action.type === AtlasLoginActionTypes.UserInfoChanged) {
    return {
      ...state,
      userInfo: (action as UserInfoChangedAction).userInfo,
    };
  }
  return state;
}

export const refreshUserInfo = (): AtlasLoginThunkAction<Promise<void>> => {
  return async (dispatch, _getState, { atlasAuthService }) => {
    let userInfo: AtlasUserInfo | null;
    try {
      userInfo = await atlasAuthService.getUserInfo();
    } catch {
      userInfo = null;
    }
    dispatch({ type: AtlasLoginActionTypes.UserInfoChanged, userInfo });
  };
};

async function isSignedIn(
  atlasAuthService: AtlasAuthService
): Promise<boolean> {
  try {
    await atlasAuthService.getUserInfo();
    return true;
  } catch {
    return false;
  }
}

export const signIn = (): AtlasLoginThunkAction<Promise<boolean>> => {
  return async (dispatch, _getState, { atlasAuthService }) => {
    if (await isSignedIn(atlasAuthService)) {
      await dispatch(refreshUserInfo());
      return true;
    }
    try {
      await atlasAuthService.signIn({ mainProcessSignIn: true });
      atlasAuthService.emit('signed-in');
    } catch {
      return false;
    }
    await dispatch(refreshUserInfo());
    openToast(CONNECTED_TOAST_ID, {
      title: 'Connected to Atlas',
      description: 'You can start using context from Atlas.',
      variant: 'success',
      timeout: 5000,
    });
    return true;
  };
};

export const clearUserInfo = (): AtlasLoginThunkAction<void> => {
  return (dispatch) => {
    dispatch({ type: AtlasLoginActionTypes.UserInfoChanged, userInfo: null });
  };
};

export const disconnect = (): AtlasLoginThunkAction<Promise<void>> => {
  return async (dispatch, _getState, { atlasAuthService }) => {
    const confirmed = await showConfirmation({
      title: 'Are you sure you want to disconnect Atlas?',
      description:
        "Once Atlas is disconnected you won't have context from Atlas anymore.",
      variant: ConfirmationModalVariant.Danger,
      buttonText: 'Disconnect',
    });
    if (!confirmed) {
      return;
    }
    try {
      await atlasAuthService.signOut();
    } finally {
      dispatch({
        type: AtlasLoginActionTypes.UserInfoChanged,
        userInfo: null,
      });
    }
    openToast(DISCONNECT_TOAST_ID, {
      title: 'Disconnected from Atlas',
      description: "You won't have context from Atlas anymore.",
      variant: 'note',
      timeout: 5000,
    });
  };
};

export function configureStore(extra: AtlasLoginThunkExtraArg) {
  return createStore(
    reducer,
    INITIAL_STATE,
    applyMiddleware(thunk.withExtraArgument(extra))
  );
}

export type AtlasLoginStore = ReturnType<typeof configureStore>;
