import type { AnyAction, Reducer } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import { openToast } from '@mongodb-js/compass-components';
import type { AtlasService } from '../renderer';

export function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

export type AtlasSignInState = {
  state:
    | 'initial'
    | 'restoring'
    | 'unauthenticated'
    | 'in-progress'
    | 'success'
    | 'error'
    | 'canceled';
  error: string | null;
  isModalOpen: boolean;
  // For managing attempt state that doesn't beling in the store
  currentAttemptId: number | null;
};

export type AtlasSignInThunkAction<
  R,
  A extends AnyAction = AnyAction
> = ThunkAction<R, AtlasSignInState, { atlasService: AtlasService }, A>;

export const enum AtlasSignInActions {
  OpenSignInModal = 'atlas-service/atlas-signin/OpenSignInModal',
  CloseSignInModal = 'atlas-service/atlas-signin/CloseSignInModal',
  RestoringStart = 'atlas-service/atlas-signin/StartRestoring',
  RestoringFailed = 'atlas-service/atlas-signin/RestoringFailed',
  RestoringSuccess = 'atlas-service/atlas-signin/RestoringSuccess',
  Start = 'atlas-service/atlas-signin/AtlasSignInStart',
  Success = 'atlas-service/atlas-signin/AtlasSignInSuccess',
  Error = 'atlas-service/atlas-signin/AtlasSignInError',
  Cancel = 'atlas-service/atlas-signin/AtlasSignInCancel',
  TokenRefreshFailed = 'atlas-service/atlas-signin/TokenRefreshFailed',
}

export type AtlasSignInOpenModalAction = {
  type: AtlasSignInActions.OpenSignInModal;
  id: number;
};

export type AtlasSignInCloseModalAction = {
  type: AtlasSignInActions.CloseSignInModal;
};

export type AtlasSignInRestoringStartAction = {
  type: AtlasSignInActions.RestoringStart;
  id: number;
};

export type AtlasSignInRestoringFailedAction = {
  type: AtlasSignInActions.RestoringFailed;
};

export type AtlasSignInRestoringSuccessAction = {
  type: AtlasSignInActions.RestoringSuccess;
};

export type AtlasSignInStartAction = {
  type: AtlasSignInActions.Start;
  id: number;
};

export type AtlasSignInSuccessAction = {
  type: AtlasSignInActions.Success;
};

export type AtlasSignInErrorAction = {
  type: AtlasSignInActions.Error;
  error: string;
};

export type AtlasSignInTokenRefreshFailedAction = {
  type: AtlasSignInActions.TokenRefreshFailed;
};

export type AtlasSignInCancelAction = { type: AtlasSignInActions.Cancel };

const INITIAL_STATE = {
  state: 'initial' as const,
  error: null,
  isModalOpen: false,
  currentAttemptId: null,
};

type AttemptState = {
  id: number;
  controller: AbortController;
  promise: Promise<void>;
  resolve: () => void;
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

const reducer: Reducer<AtlasSignInState> = (
  state = { ...INITIAL_STATE },
  action
) => {
  if (
    isAction<AtlasSignInRestoringStartAction>(
      action,
      AtlasSignInActions.RestoringStart
    )
  ) {
    return { ...state, state: 'restoring' };
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
    return { ...state, state: 'success', error: null };
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
    return { ...state, state: 'unauthenticated' };
  }

  if (isAction<AtlasSignInStartAction>(action, AtlasSignInActions.Start)) {
    return { ...state, state: 'in-progress' };
  }

  if (isAction<AtlasSignInSuccessAction>(action, AtlasSignInActions.Success)) {
    return {
      ...state,
      isModalOpen: false,
      state: 'success',
      error: null,
      currentAttemptId: null,
    };
  }

  if (isAction<AtlasSignInErrorAction>(action, AtlasSignInActions.Error)) {
    return {
      ...state,
      isModalOpen: false,
      state: 'error',
      error: action.error,
      currentAttemptId: null,
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
    return { ...state, currentAttemptId: action.id, isModalOpen: true };
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

  return state;
};

export const restoreSignInState = (): AtlasSignInThunkAction<Promise<void>> => {
  return async (dispatch, getState, { atlasService }) => {
    // Only allow restore from initial state
    if (getState().state !== 'initial') {
      return;
    }
    dispatch({ type: AtlasSignInActions.RestoringStart });
    try {
      dispatch({
        type: (await atlasService.isAuthenticated())
          ? AtlasSignInActions.RestoringSuccess
          : AtlasSignInActions.RestoringFailed,
      });
    } catch (err) {
      // For the initial state check if failed to check auth for any reason we
      // will just allow user to sign in again, ignoring the error
      dispatch({ type: AtlasSignInActions.RestoringFailed });
    }
  };
};

export const signInWithModalPrompt = ({
  signal,
}: { signal?: AbortSignal } = {}): AtlasSignInThunkAction<Promise<void>> => {
  return async (dispatch, getState) => {
    // Nothing to do if we already signed in
    if (getState().state === 'success') {
      return;
    }
    const attempt = getAttempt(getState().currentAttemptId);
    // Listen to the external signal if provided and stop sign in process when
    // aborted
    signal?.addEventListener('abort', () => {
      dispatch(closeSignInModal(signal.reason));
    });
    dispatch(openSignInModal(attempt.id));
    return attempt.promise;
  };
};

export const openSignInModal = (id: number) => {
  return {
    type: AtlasSignInActions.OpenSignInModal,
    id,
  };
};

/**
 * Sign in from the opt in window
 */
export const signIn = (): AtlasSignInThunkAction<Promise<void>> => {
  return async (dispatch, getState, { atlasService }) => {
    const {
      controller: { signal },
      resolve,
      reject,
    } = getAttempt(getState().currentAttemptId);
    dispatch({ type: AtlasSignInActions.Start });

    try {
      if ((await atlasService.isAuthenticated({ signal })) === false) {
        await atlasService.signIn({ signal });
      }
      const user = await atlasService.getUserInfo({ signal });
      openToast('atlas-sign-in-success', {
        variant: 'success',
        title: `Signed in as ${user.login}`,
        timeout: 10_000,
      });
      dispatch({ type: AtlasSignInActions.Success });
      resolve();
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

export const closeSignInModal = (
  reason?: any
): AtlasSignInThunkAction<void> => {
  return (dispatch) => {
    dispatch(cancelSignIn(reason));
    dispatch({ type: AtlasSignInActions.CloseSignInModal });
  };
};

export const tokenRefreshFailed = () => {
  return { type: AtlasSignInActions.TokenRefreshFailed };
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

export default reducer;
