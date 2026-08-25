import type { Action, AnyAction, Reducer } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import { openToast } from '@mongodb-js/compass-components';
import type {
  AtlasSignInEntrypoint,
  TrackFunction,
} from '@mongodb-js/compass-telemetry';
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
  attemptNumber: number;
} & (
  | {
      state:
        | 'initial'
        | 'restoring'
        | 'unauthenticated'
        | 'in-progress'
        | 'error'
        | 'canceled'
        | 'timed-out';
      userInfo: null;
    }
  | { state: 'success'; userInfo: AtlasUserInfo }
);

export type SignInAttemptResult =
  | { status: 'success'; userInfo: AtlasUserInfo }
  | { status: 'timed-out' }
  | { status: 'canceled' }
  | { status: 'error'; error: Error };

export type AtlasSignInThunkAction<
  R,
  A extends AnyAction = AnyAction
> = ThunkAction<
  R,
  AtlasSignInState,
  { atlasAuthService: AtlasAuthService; track: TrackFunction },
  A
>;

class TimeoutError extends Error {
  constructor() {
    super('Sign in timed out');
  }
}

class CanceledError extends Error {
  constructor() {
    super('Sign in canceled');
  }
}

// @ts-expect-error TODO(COMPASS-10124): replace enums with const kv objects
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
  TimedOut = 'atlas-service/atlas-signin/AtlasSignInTimedOut',
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

export type AtlasSignInTimedOutAction = { type: AtlasSignInActions.TimedOut };

const INITIAL_STATE = {
  state: 'initial' as const,
  userInfo: null,
  error: null,
  isModalOpen: false,
  currentAttemptId: null,
  attemptNumber: 1,
};

type AttemptState = {
  id: number;
  controller: AbortController;
  promise: Promise<AtlasUserInfo>;
  resolve: (userInfo: AtlasUserInfo) => void;
  reject: (reason?: any) => void;
};

export const SIGN_IN_TIMEOUT_MS = 2 * 60 * 1000; // 2 Minutes

// Exported for testing purposes only
export const AttemptStateMap = new Map<number, AttemptState>();

export let attemptId = 0;

function getAttempt(id?: number | null): AttemptState {
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
      attemptNumber: state.attemptNumber + 1,
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
      attemptNumber: 1,
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
    return {
      ...INITIAL_STATE,
      state: 'canceled',
      attemptNumber: state.attemptNumber,
    };
  }

  if (
    isAction<AtlasSignInTimedOutAction>(action, AtlasSignInActions.TimedOut)
  ) {
    return {
      ...INITIAL_STATE,
      state: 'timed-out',
      attemptNumber: state.attemptNumber,
    };
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
    } catch {
      // For the initial state check if failed to check auth for any reason we
      // will just allow user to sign in again, ignoring the error
      dispatch({ type: AtlasSignInActions.RestoringFailed });
    }
  };
};

const startAttempt = (fn: () => void): AtlasSignInThunkAction<AttemptState> => {
  return (dispatch) => {
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
  entrypoint = 'unknown',
}: {
  signal?: AbortSignal;
  entrypoint?: AtlasSignInEntrypoint;
} = {}): AtlasSignInThunkAction<Promise<SignInAttemptResult>> => {
  return async (dispatch, getState, { track }) => {
    // Nothing to do if we already signed in
    const { state, userInfo, currentAttemptId, attemptNumber } = getState();
    if (state === 'success') {
      return { status: 'success', userInfo };
    }

    if (currentAttemptId) {
      return toSignInAttemptResult(
        getAttempt(currentAttemptId).promise,
        getState
      );
    }

    const attempt = dispatch(
      startAttempt(() => {
        void dispatch(signIn({ entrypoint }));
      })
    );
    // The attemptNumber is incremented when AttemptStart is dispatched, so we
    // must track the event after it.
    track('Atlas Sign In Started', {
      entrypoint,
      attempt: attemptNumber,
      previousOutcome:
        state === 'error' || state === 'canceled' || state === 'timed-out'
          ? state
          : null,
    });
    signal?.addEventListener('abort', () => {
      dispatch(cancelSignIn(signal.reason));
    });
    return toSignInAttemptResult(attempt.promise, getState);
  };
};

async function toSignInAttemptResult(
  promise: Promise<AtlasUserInfo>,
  getState: () => AtlasSignInState
): Promise<SignInAttemptResult> {
  try {
    const userInfo = await promise;
    return { status: 'success', userInfo };
  } catch (error) {
    const state = getState().state;
    if (state === 'timed-out') return { status: 'timed-out' };
    if (state === 'canceled') return { status: 'canceled' };
    return { status: 'error', error: error as Error };
  }
}

/**
 * Sign into Atlas. To be called when the user isn't signed in yet.
 */
export const signIn =
  ({
    entrypoint,
  }: {
    entrypoint: AtlasSignInEntrypoint;
  }): AtlasSignInThunkAction<Promise<void>> =>
  async (dispatch, getState, { atlasAuthService, track }) => {
    const {
      id: currentAttemptId,
      controller,
      resolve,
      reject,
    } = getAttempt(getState().currentAttemptId);
    dispatch({ type: AtlasSignInActions.Start });
    const signal = controller.signal;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      throwIfAborted(signal);
      let userInfo;

      const doSignIn = async () => {
        if (await atlasAuthService.isAuthenticated({ signal })) {
          userInfo = await atlasAuthService.getUserInfo({ signal });
        } else {
          userInfo = await atlasAuthService.signIn({
            signal,
          });
        }
        openToast('atlas-sign-in-success', {
          variant: 'success',
          title: `Atlas sign in successful`,
          timeout: 10_000,
        });
        dispatch({ type: AtlasSignInActions.Success, userInfo });
        AttemptStateMap.clear();
        resolve(userInfo);
      };
      const timeoutPromise = new Promise<never>((_resolve, reject) => {
        timeoutId = setTimeout(() => {
          controller.abort(new TimeoutError());
          reject(new TimeoutError());
        }, SIGN_IN_TIMEOUT_MS);
      });

      await Promise.race([doSignIn(), timeoutPromise]);
    } catch (err) {
      if (signal.aborted) {
        // the canceled flow must be tracked outside of the signIn function
        // as it can be triggered by an external caller.
        if (signal.reason instanceof CanceledError) {
          return;
        } else if (signal.reason instanceof TimeoutError) {
          openToast('atlas-timed-out', {
            title: 'The login to Atlas has timed out, please try again.',
            variant: 'note',
            timeout: 5000,
          });
          dispatch({ type: AtlasSignInActions.TimedOut });
          track('Atlas Sign In Timed Out', { entrypoint });
          reject(signal.reason);
        }
      } else {
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
      AttemptStateMap.delete(currentAttemptId);
    } finally {
      // if the timeout is not cleared the promise will be dangling around
      clearTimeout(timeoutId);
    }
  };

export const cancelSignIn = (reason: any): AtlasSignInThunkAction<void> => {
  return (dispatch, getState, { track }) => {
    // Can't cancel sign in after the flow was finished indicated by current
    // attempt id being set to null
    if (getState().currentAttemptId === null) {
      return;
    }
    const attempt = getAttempt(getState().currentAttemptId);
    attempt.controller.abort(new CanceledError());
    attempt.reject(reason ?? attempt.controller.signal.reason);
    AttemptStateMap.delete(attempt.id);
    dispatch({ type: AtlasSignInActions.Cancel });
    track('Atlas Sign In Canceled', {});
  };
};

export const tokenRefreshFailed = (): AtlasSignInThunkAction<void> => {
  return (dispatch, _getState) => {
    dispatch({ type: AtlasSignInActions.TokenRefreshFailed });
  };
};

export const signOut = (): AtlasSignInThunkAction<Promise<void>> => {
  return async (dispatch, _getState, { atlasAuthService }) => {
    try {
      await atlasAuthService.signOut();
      dispatch({ type: AtlasSignInActions.SignedOut });
      openToast('atlas-disconnected', {
        title: 'Disconnected from Atlas',
        variant: 'note',
        timeout: 5000,
      });
    } catch (err) {
      openToast('atlas-disconnect-error', {
        title: 'Failed to disconnect from Atlas',
        description: (err as Error).message,
        variant: 'warning',
        timeout: 5000,
      });
    }
  };
};

export default reducer;
