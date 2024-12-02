import type { Action, AnyAction, Reducer } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import { openToast } from '@mongodb-js/compass-components';
import type { AtlasUserInfo } from '../util';
import type { AtlasAuthService } from '../provider';
import { throwIfAborted } from '@mongodb-js/compass-utils';

export function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

export type AtlasSignInState = {
  error: string | null;
  // For managing attempt state that doesn't belong in the store
  currentAttemptId: number | null;
} & (
  | {
      state:
        | 'initial'
        | 'restoring'
        | 'unauthenticated'
        | 'in-progress'
        | 'error'
        | 'canceled';
      userInfo: null;
    }
  | { state: 'success'; userInfo: AtlasUserInfo }
);

export type AtlasSignInThunkAction<
  R,
  A extends AnyAction = AnyAction
> = ThunkAction<R, AtlasSignInState, { atlasAuthService: AtlasAuthService }, A>;

export const enum AtlasSignInActions {
  RestoringStart = 'atlas-service/atlas-signin/StartRestoring',
  RestoringFailed = 'atlas-service/atlas-signin/RestoringFailed',
  RestoringSuccess = 'atlas-service/atlas-signin/RestoringSuccess',
  AttemptStart = 'atlas-service/atlas-signin/AttemptStart',
  AttemptEnd = 'atlas-service/atlas-signin/AttemptEnd',
  Start = 'atlas-service/atlas-signin/AtlasSignInStart',
  Success = 'atlas-service/atlas-signin/AtlasSignInSuccess',
  Error = 'atlas-service/atlas-signin/AtlasSignInError',
  Cancel = 'atlas-service/atlas-signin/AtlasSignInCancel',
  TokenRefreshFailed = 'atlas-service/atlas-signin/TokenRefreshFailed',
  SignedOut = 'atlas-service/atlas-signin/SignedOut',
}

export type AtlasSignInRestoringStartAction = {
  type: AtlasSignInActions.RestoringStart;
};

export type AtlasSignInRestoringFailedAction = {
  type: AtlasSignInActions.RestoringFailed;
};

export type AtlasSignInRestoringSuccessAction = {
  type: AtlasSignInActions.RestoringSuccess;
  userInfo: AtlasUserInfo;
};

export type AtlasSignInAttemptStartAction = {
  type: AtlasSignInActions.AttemptStart;
  id: number;
};

export type AtlasSignInAttemptEndAction = {
  type: AtlasSignInActions.AttemptEnd;
  id: number;
};

export type AtlasSignInStartAction = {
  type: AtlasSignInActions.Start;
};

export type AtlasSignInSuccessAction = {
  type: AtlasSignInActions.Success;
  userInfo: AtlasUserInfo;
};

export type AtlasSignInErrorAction = {
  type: AtlasSignInActions.Error;
  error: string;
};

export type AtlasSignInTokenRefreshFailedAction = {
  type: AtlasSignInActions.TokenRefreshFailed;
};

export type AtlasSignInSignedOutAction = {
  type: AtlasSignInActions.SignedOut;
};

export type AtlasSignInCancelAction = { type: AtlasSignInActions.Cancel };

const INITIAL_STATE = {
  state: 'initial' as const,
  userInfo: null,
  error: null,
  isModalOpen: false,
  currentAttemptId: null,
};

type AttemptState = {
  id: number;
  controller: AbortController;
  promise: Promise<AtlasUserInfo>;
  resolve: (userInfo: AtlasUserInfo) => void;
  reject: (reason?: any) => void;
};

// Exported for testing purposes only
export const AttemptStateMap = new Map<number, AttemptState>();

export let attemptId = 0;

export function getAttempt(id?: number | null): AttemptState {
  if (!id) {
    id = ++attemptId;
    const controller = new AbortController();
    let resolve;
    let reject;
    const promise = new Promise<AtlasUserInfo>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    if (resolve && reject) {
      AttemptStateMap.set(id, {
        id,
        controller,
        promise,
        resolve: resolve,
        reject: reject,
      });
    }
  }
  const attemptState = AttemptStateMap.get(id);
  if (!attemptState) {
    throw new Error(
      'Trying to get the state for a non-existing sign in attempt'
    );
  }
  return attemptState;
}

const reducer: Reducer<AtlasSignInState, Action> = (
  state = { ...INITIAL_STATE },
  action
) => {
  if (
    isAction<AtlasSignInRestoringStartAction>(
      action,
      AtlasSignInActions.RestoringStart
    )
  ) {
    return { ...state, userInfo: null, state: 'restoring' };
  }

  if (
    isAction<AtlasSignInRestoringSuccessAction>(
      action,
      AtlasSignInActions.RestoringSuccess
    )
  ) {
    // Something manually triggered sign in, ignore restoring result and just
    // wait for manual sign in result
    if (state.state !== 'restoring') {
      return state;
    }
    return {
      ...state,
      state: 'success',
      userInfo: action.userInfo,
      error: null,
    };
  }

  if (
    isAction<AtlasSignInRestoringFailedAction>(
      action,
      AtlasSignInActions.RestoringFailed
    )
  ) {
    if (state.state !== 'restoring') {
      return state;
    }
    return { ...state, state: 'unauthenticated', userInfo: null };
  }

  if (
    isAction<AtlasSignInAttemptStartAction>(
      action,
      AtlasSignInActions.AttemptStart
    )
  ) {
    return {
      ...state,
      currentAttemptId: action.id,
    };
  }

  if (
    isAction<AtlasSignInAttemptEndAction>(action, AtlasSignInActions.AttemptEnd)
  ) {
    return {
      ...state,
      currentAttemptId: null,
    };
  }

  if (isAction<AtlasSignInStartAction>(action, AtlasSignInActions.Start)) {
    return { ...state, state: 'in-progress', userInfo: null };
  }

  if (isAction<AtlasSignInSuccessAction>(action, AtlasSignInActions.Success)) {
    return {
      ...state,
      state: 'success',
      userInfo: action.userInfo,
      error: null,
      isModalOpen: false,
    };
  }

  if (isAction<AtlasSignInErrorAction>(action, AtlasSignInActions.Error)) {
    return {
      ...state,
      state: 'error',
      userInfo: null,
      error: action.error,
      isModalOpen: false,
    };
  }

  if (isAction<AtlasSignInCancelAction>(action, AtlasSignInActions.Cancel)) {
    return { ...INITIAL_STATE, state: 'canceled' };
  }

  if (
    isAction<AtlasSignInTokenRefreshFailedAction>(
      action,
      AtlasSignInActions.TokenRefreshFailed
    )
  ) {
    // Only reset state on refresh failed when we are currently successfully
    // signed in. All other cases mean that either there is a sign in already
    // in progress or something else already failed: no need to update either
    // way
    if (state.state !== 'success') {
      return state;
    }
    return { ...INITIAL_STATE, state: 'error' };
  }

  if (
    isAction<AtlasSignInSignedOutAction>(action, AtlasSignInActions.SignedOut)
  ) {
    return { ...INITIAL_STATE };
  }

  return state;
};

export const restoreSignInState = (): AtlasSignInThunkAction<Promise<void>> => {
  return async (dispatch, getState, { atlasAuthService }) => {
    // Only allow restore from initial state
    if (getState().state !== 'initial') {
      return;
    }
    dispatch({ type: AtlasSignInActions.RestoringStart });
    try {
      if (await atlasAuthService.isAuthenticated()) {
        const userInfo = await atlasAuthService.getUserInfo();
        dispatch({ type: AtlasSignInActions.RestoringSuccess, userInfo });
      } else {
        dispatch({ type: AtlasSignInActions.RestoringFailed });
      }
    } catch (err) {
      // For the initial state check if failed to check auth for any reason we
      // will just allow user to sign in again, ignoring the error
      dispatch({ type: AtlasSignInActions.RestoringFailed });
    }
  };
};

const startAttempt = (fn: () => void): AtlasSignInThunkAction<AttemptState> => {
  return (dispatch, getState) => {
    if (getState().currentAttemptId) {
      throw new Error(
        "Can't start sign in with prompt while another sign in attempt is in progress"
      );
    }
    const attempt = getAttempt();
    dispatch({ type: AtlasSignInActions.AttemptStart, id: attempt.id });
    attempt.promise
      .finally(() => {
        dispatch({ type: AtlasSignInActions.AttemptEnd, id: attempt.id });
      })
      .catch(() => {
        // noop for the promise created by `finally`, original promise rejection
        // should be handled by the service user
      });
    setTimeout(fn);
    return attempt;
  };
};

export const performSignInAttempt = ({
  signal,
}: { signal?: AbortSignal } = {}): AtlasSignInThunkAction<
  Promise<AtlasUserInfo>
> => {
  return async (dispatch, getState) => {
    // Nothing to do if we already signed in
    const { state, userInfo } = getState();
    if (state === 'success') {
      return userInfo;
    }
    const attempt = dispatch(
      startAttempt(() => {
        void dispatch(signIn());
      })
    );
    signal?.addEventListener('abort', () => {
      dispatch(cancelSignIn(signal.reason));
    });
    return attempt.promise;
  };
};

/**
 * Sign into Atlas. To be called when the user isn't signed in yet.
 */
export const signIn = (): AtlasSignInThunkAction<Promise<void>> => {
  return async (dispatch, getState, { atlasAuthService }) => {
    const {
      controller: { signal },
      resolve,
      reject,
    } = getAttempt(getState().currentAttemptId);
    dispatch({ type: AtlasSignInActions.Start });
    try {
      throwIfAborted(signal);
      let userInfo;
      if (await atlasAuthService.isAuthenticated({ signal })) {
        userInfo = await atlasAuthService.getUserInfo({ signal });
      } else {
        userInfo = await atlasAuthService.signIn({
          mainProcessSignIn: true,
          signal,
        });
      }
      openToast('atlas-sign-in-success', {
        variant: 'success',
        title: `Signed in as ${userInfo.login}`,
        timeout: 10_000,
      });
      dispatch({ type: AtlasSignInActions.Success, userInfo });
      atlasAuthService.emit('signed-in');
      resolve(userInfo);
    } catch (err) {
      // Only handle error if sign in wasn't aborted by the user, otherwise it
      // was already handled in `cancelSignIn` action
      if (signal.aborted) {
        return;
      }
      openToast('atlas-sign-in-error', {
        variant: 'important',
        title: 'Sign in failed',
        description: (err as Error).message,
      });
      dispatch({
        type: AtlasSignInActions.Error,
        error: (err as Error).message,
      });
      reject(err);
    }
  };
};

export const cancelSignIn = (reason?: any): AtlasSignInThunkAction<void> => {
  return (dispatch, getState) => {
    // Can't cancel sign in after the flow was finished indicated by current
    // attempt id being set to null
    if (getState().currentAttemptId === null) {
      return;
    }
    const attempt = getAttempt(getState().currentAttemptId);
    attempt.controller.abort();
    attempt.reject(reason ?? attempt.controller.signal.reason);
    dispatch({ type: AtlasSignInActions.Cancel });
  };
};

export const tokenRefreshFailed = (): AtlasSignInThunkAction<void> => {
  return (dispatch, _getState, { atlasAuthService }) => {
    dispatch({ type: AtlasSignInActions.TokenRefreshFailed });
    atlasAuthService.emit('token-refresh-failed');
  };
};

export const signedOut = (): AtlasSignInThunkAction<void> => {
  return (dispatch, _getState, { atlasAuthService }) => {
    dispatch({ type: AtlasSignInActions.SignedOut });
    atlasAuthService.emit('signed-out');
  };
};

export default reducer;
