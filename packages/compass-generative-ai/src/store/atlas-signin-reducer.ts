import type { Action, AnyAction, Reducer } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import type { AtlasAuthService } from '@mongodb-js/atlas-service/provider';
import { throwIfAborted } from '@mongodb-js/compass-utils';
import type { RootState } from './atlas-ai-store';
import { isAction } from '../utils/util';

type AttemptState = {
  id: number;
  controller: AbortController;
  promise: Promise<void>;
  resolve: () => void;
  reject: (reason?: any) => void;
};

export type AtlasSignInState = {
  error: string | null;
  isModalOpen: boolean;
  attemptId: number | null;
} & (
  | {
      state: 'initial' | 'in-progress' | 'error' | 'canceled';
    }
  | { state: 'success' }
);

export type GenAIAtlasSignInThunkAction<
  R,
  A extends AnyAction = AnyAction
> = ThunkAction<R, RootState, { atlasAuthService: AtlasAuthService }, A>;

export const enum AtlasSignInActions {
  OpenSignInModal = 'compass-generative-ai/atlas-signin/OpenSignInModal',
  CloseSignInModal = 'compass-generative-ai/atlas-signin/CloseSignInModal',
  AttemptStart = 'compass-generative-ai/atlas-signin/AttemptStart',
  AttemptEnd = 'compass-generative-ai/atlas-signin/AttemptEnd',
  Start = 'compass-generative-ai/atlas-signin/AtlasSignInStart',
  Success = 'compass-generative-ai/atlas-signin/AtlasSignInSuccess',
  Error = 'compass-generative-ai/atlas-signin/AtlasSignInError',
  Cancel = 'compass-generative-ai/atlas-signin/AtlasSignInCancel',
  SignInTokenRefreshFailed = 'compass-generative-ai/atlas-signin/SignInTokenRefreshFailed',
  SignedOut = 'compass-generative-ai/atlas-signin/SignedOut',
}

export type AtlasSignInOpenModalAction = {
  type: AtlasSignInActions.OpenSignInModal;
};

export type AtlasSignInCloseModalAction = {
  type: AtlasSignInActions.CloseSignInModal;
};

export type AtlasSignInAttemptStartAction = {
  type: AtlasSignInActions.AttemptStart;
  attemptId: number;
};

export type AtlasSignInAttemptEndAction = {
  type: AtlasSignInActions.AttemptEnd;
  attemptId: number;
};

export type AtlasSignInStartAction = {
  type: AtlasSignInActions.Start;
};

export type AtlasSignInSuccessAction = {
  type: AtlasSignInActions.Success;
};

export type AtlasSignInErrorAction = {
  type: AtlasSignInActions.Error;
  error: string;
};

export type AtlasSignInTokenRefreshFailedAction = {
  type: AtlasSignInActions.SignInTokenRefreshFailed;
};

export type AtlasSignInSignedOutAction = {
  type: AtlasSignInActions.SignedOut;
};

export type AtlasSignInCancelAction = { type: AtlasSignInActions.Cancel };

const INITIAL_STATE = {
  state: 'initial' as const,
  error: null,
  isModalOpen: false,
  attemptId: null,
};

// Exported for testing purposes only.
export const AttemptStateMap = new Map<number, AttemptState>();

export let attemptId = 0;

export function getAttempt(id?: number | null): AttemptState {
  if (!id) {
    id = ++attemptId;
    const controller = new AbortController();
    let resolve;
    let reject;
    const promise = new Promise<void>((res, rej) => {
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

const signInReducer: Reducer<AtlasSignInState, Action> = (
  state = { ...INITIAL_STATE },
  action
) => {
  if (
    isAction<AtlasSignInAttemptStartAction>(
      action,
      AtlasSignInActions.AttemptStart
    )
  ) {
    return {
      ...state,
      attemptId: action.attemptId,
    };
  }

  if (
    isAction<AtlasSignInAttemptEndAction>(action, AtlasSignInActions.AttemptEnd)
  ) {
    return {
      ...state,
      attemptId: null,
    };
  }

  if (isAction<AtlasSignInStartAction>(action, AtlasSignInActions.Start)) {
    return { ...state, state: 'in-progress' };
  }

  if (isAction<AtlasSignInSuccessAction>(action, AtlasSignInActions.Success)) {
    return {
      ...state,
      state: 'success',
      error: null,
      isModalOpen: false,
    };
  }

  if (isAction<AtlasSignInErrorAction>(action, AtlasSignInActions.Error)) {
    return {
      ...state,
      state: 'error',
      error: action.error,
      isModalOpen: false,
    };
  }

  if (isAction<AtlasSignInCancelAction>(action, AtlasSignInActions.Cancel)) {
    return { ...INITIAL_STATE, state: 'canceled' };
  }

  if (
    isAction<AtlasSignInOpenModalAction>(
      action,
      AtlasSignInActions.OpenSignInModal
    )
  ) {
    return { ...state, isModalOpen: true };
  }

  if (
    isAction<AtlasSignInCloseModalAction>(
      action,
      AtlasSignInActions.CloseSignInModal
    )
  ) {
    return { ...state, isModalOpen: false };
  }

  if (
    isAction<AtlasSignInTokenRefreshFailedAction>(
      action,
      AtlasSignInActions.SignInTokenRefreshFailed
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

const startAttempt = (
  fn: () => void
): GenAIAtlasSignInThunkAction<AttemptState> => {
  return (dispatch, getState) => {
    if (getState().signIn.attemptId) {
      throw new Error(
        "Can't start sign in with prompt while another sign in attempt is in progress"
      );
    }
    const attempt = getAttempt();
    dispatch({ type: AtlasSignInActions.AttemptStart, attemptId: attempt.id });
    attempt.promise
      .finally(() => {
        dispatch({
          type: AtlasSignInActions.AttemptEnd,
          attemptId: attempt.id,
        });
      })
      .catch(() => {
        // noop for the promise created by `finally`, original promise rejection
        // should be handled by the service user
      });
    setTimeout(fn);
    return attempt;
  };
};

export const signIntoAtlasWithModalPrompt = ({
  signal,
}: { signal?: AbortSignal } = {}): GenAIAtlasSignInThunkAction<
  Promise<void>
> => {
  return (dispatch, getState) => {
    // Nothing to do if we already signed in.
    const { state } = getState().signIn;
    if (state === 'success') {
      return Promise.resolve();
    }
    const attempt = dispatch(
      startAttempt(() => {
        dispatch(openSignInModal());
      })
    );
    signal?.addEventListener('abort', () => {
      dispatch(closeSignInModal(signal.reason));
    });
    return attempt.promise;
  };
};

export const signIn = (): GenAIAtlasSignInThunkAction<Promise<void>> => {
  return async (dispatch, getState, { atlasAuthService }) => {
    if (['in-progress', 'authenticated'].includes(getState().signIn.state)) {
      return;
    }
    const { attemptId } = getState().signIn;
    if (attemptId === null) {
      return;
    }
    const {
      controller: { signal },
      resolve,
      reject,
    } = getAttempt(getState().signIn.attemptId);
    dispatch({
      type: AtlasSignInActions.Start,
    });

    try {
      throwIfAborted(signal);

      await atlasAuthService.signIn({
        signal,
      });
      dispatch(atlasServiceSignedIn());
      resolve();
    } catch (err) {
      if (signal.aborted) {
        return;
      }
      dispatch({
        type: AtlasSignInActions.Error,
        error: (err as Error).message,
      });
      reject(err);
    }
  };
};

export const openSignInModal = () => {
  return { type: AtlasSignInActions.OpenSignInModal };
};

export const closeSignInModal = (
  reason?: any
): GenAIAtlasSignInThunkAction<void> => {
  return (dispatch) => {
    dispatch(cancelSignIn(reason));
    dispatch({ type: AtlasSignInActions.CloseSignInModal });
  };
};

export const cancelSignIn = (
  reason?: any
): GenAIAtlasSignInThunkAction<void> => {
  return (dispatch, getState) => {
    // Can't cancel sign in after the flow was finished indicated by current
    // attempt id being set to null
    if (getState().signIn.attemptId === null) {
      return;
    }
    const attempt = getAttempt(getState().signIn.attemptId);
    attempt.controller.abort();
    attempt.reject(reason ?? attempt.controller.signal.reason);
    dispatch({ type: AtlasSignInActions.Cancel });
  };
};

export const atlasServiceSignInTokenRefreshFailed = () => ({
  type: AtlasSignInActions.SignInTokenRefreshFailed,
});

export const atlasServiceSignedOut = () => ({
  type: AtlasSignInActions.SignedOut,
});

export const atlasServiceSignedIn = () => ({
  type: AtlasSignInActions.Success,
});

export default signInReducer;
