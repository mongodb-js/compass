import type { Reducer } from 'redux';
import { isAction } from '../utils';
import type { QueryBarThunkAction } from './query-bar-store';
import { openToast } from '@mongodb-js/compass-components';

type UserInfo = unknown;

type Token = unknown;

type AtlasSignInState = {
  // For managing abort controller out of the state
  currentAttemptId: number;
  state: 'initial' | 'in-progress' | 'success' | 'error';
  error: string | null;
  user: UserInfo | null;
  token: Token | null;
};

export const enum AtlasSignInActions {
  Start = 'compass-query-bar/atlas-signin/AtlasSignInStart',
  Success = 'compass-query-bar/atlas-signin/AtlasSignInSuccess',
  Error = 'compass-query-bar/atlas-signin/AtlasSignInError',
  Cancel = 'compass-query-bar/atlas-signin/AtlasSignInCancel',
}

export type AtlasSignInStartAction = {
  type: AtlasSignInActions.Start;
  id: number;
};

export type AtlasSignInSuccessAction = {
  type: AtlasSignInActions.Success;
  user: UserInfo;
  token: Token;
};

export type AtlasSignInErrorAction = {
  type: AtlasSignInActions.Error;
  error: string;
};

export type AtlasSignInCancelAction = { type: AtlasSignInActions.Cancel };

const INITIAL_STATE = {
  currentAttemptId: -1,
  state: 'initial' as const,
  error: null,
  user: null,
  token: null,
};

const AbortControllerMap = new Map<number, AbortController>();

let abortId = 0;

function getAbortSignal() {
  const id = abortId++;
  const controller = new AbortController();
  AbortControllerMap.set(id, controller);
  return { id, signal: controller.signal };
}

function abort(id: number) {
  AbortControllerMap.get(id)?.abort();
}

const reducer: Reducer<AtlasSignInState> = (
  state = { ...INITIAL_STATE },
  action
) => {
  if (isAction<AtlasSignInStartAction>(action, AtlasSignInActions.Start)) {
    return { ...state, state: 'in-progress', currentAttemptId: action.id };
  }

  if (isAction<AtlasSignInSuccessAction>(action, AtlasSignInActions.Success)) {
    return {
      ...state,
      state: 'success',
      user: action.user,
      token: action.token,
      error: null,
    };
  }

  if (isAction<AtlasSignInErrorAction>(action, AtlasSignInActions.Error)) {
    return { ...state, state: 'error', user: null, error: action.error };
  }

  if (isAction<AtlasSignInCancelAction>(action, AtlasSignInActions.Cancel)) {
    return { ...INITIAL_STATE };
  }

  return state;
};

/**
 * Sign in from the opt in window
 */
export const signIn = (): QueryBarThunkAction<Promise<void>> => {
  return async (dispatch, _getState, { atlasSignIn }) => {
    const onSuccess = (user: UserInfo, token: Token) => {
      openToast('atlas-sign-in-success', {
        variant: 'success',
        title: `Signed in as ${user.login}`,
        timeout: 10_000,
      });
      dispatch({ type: AtlasSignInActions.Success, user, token });
    };

    if (await atlasSignIn.isAuthenticated()) {
      const user = await atlasSignIn.userInfo();
      onSuccess(user, {});
    } else {
      const {
        id,
        // TODO: actually add support for this in atlas sign in service
      } = getAbortSignal();
      dispatch({ type: AtlasSignInActions.Start, id });
      try {
        const token = await atlasSignIn.signIn();
        console.log({ token });
        const user = await atlasSignIn.userInfo();
        onSuccess(user, token);
      } catch (err) {
        openToast('atlas-sign-in-error', {
          variant: 'important',
          title: 'Sign in failed',
          description: (err as Error).message,
        });
        dispatch({
          type: AtlasSignInActions.Error,
          error: (err as Error).message,
        });
      }
    }
  };
};

export const cancelSignIn = (): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    if (getState().atlasSignIn.state === 'in-progress') {
      abort(getState().atlasSignIn.currentAttemptId);
      dispatch({ type: AtlasSignInActions.Cancel });
    }
  };
};

export default reducer;
