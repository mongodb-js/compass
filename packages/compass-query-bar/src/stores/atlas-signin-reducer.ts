import type { Reducer } from 'redux';
import { openToast } from '@mongodb-js/compass-components';
import type { QueryBarThunkAction } from './query-bar-store';
import { isAction } from '../utils';

type AtlasSignInState = {
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
  // For managing abort controller out of the state
  currentAttemptId: number;
};

export const enum AtlasSignInActions {
  OpenSignInModal = 'compass-query-bar/atlas-signin/OpenSignInModal',
  CloseSignInModal = 'compass-query-bar/atlas-signin/CloseSignInModal',
  RestoringStart = 'compass-query-bar/atlas-signin/StartRestoring',
  RestoringFailed = 'compass-query-bar/atlas-signin/RestoringFailed',
  RestoringSuccess = 'compass-query-bar/atlas-signin/RestoringSuccess',
  Start = 'compass-query-bar/atlas-signin/AtlasSignInStart',
  Success = 'compass-query-bar/atlas-signin/AtlasSignInSuccess',
  Error = 'compass-query-bar/atlas-signin/AtlasSignInError',
  Cancel = 'compass-query-bar/atlas-signin/AtlasSignInCancel',
}
export type AtlasSignInOpenModalAction = {
  type: AtlasSignInActions.OpenSignInModal;
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

export type AtlasSignInCancelAction = { type: AtlasSignInActions.Cancel };

const INITIAL_STATE = {
  currentAttemptId: -1,
  state: 'initial' as const,
  error: null,
  isModalOpen: false,
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
  AbortControllerMap.delete(id);
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
    return { ...state, state: 'restoring', currentAttemptId: action.id };
  }

  if (
    isAction<AtlasSignInRestoringSuccessAction>(
      action,
      AtlasSignInActions.RestoringSuccess
    )
  ) {
    return { ...state, state: 'success', error: null };
  }

  if (
    isAction<AtlasSignInRestoringFailedAction>(
      action,
      AtlasSignInActions.RestoringFailed
    )
  ) {
    return { ...state, state: 'unauthenticated' };
  }

  if (isAction<AtlasSignInStartAction>(action, AtlasSignInActions.Start)) {
    return { ...state, state: 'in-progress', currentAttemptId: action.id };
  }

  if (isAction<AtlasSignInSuccessAction>(action, AtlasSignInActions.Success)) {
    return { ...state, isModalOpen: false, state: 'success', error: null };
  }

  if (isAction<AtlasSignInErrorAction>(action, AtlasSignInActions.Error)) {
    return { ...state, state: 'error', user: null, error: action.error };
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

  return state;
};

export const getInitialSignInState = (): QueryBarThunkAction<Promise<void>> => {
  return async (dispatch, getState, { atlasService }) => {
    if (getState().atlasSignIn.state === 'success') {
      return;
    }
    dispatch(cancelSignIn());
    const { id, signal } = getAbortSignal();
    dispatch({ type: AtlasSignInActions.RestoringStart, id });
    try {
      dispatch({
        type: (await atlasService.isAuthenticated({ signal }))
          ? AtlasSignInActions.RestoringSuccess
          : AtlasSignInActions.RestoringFailed,
      });
    } catch (err) {
      if (signal.aborted) {
        return;
      }
      // For the initial state check if failed to check auth for any reason we
      // will just allow user to sign in again, ignoring the error. This will
      // show the error in the toast if it fails again
      dispatch({
        type: AtlasSignInActions.RestoringFailed,
      });
    }
  };
};

export const openSignInModal = () => {
  return {
    type: AtlasSignInActions.OpenSignInModal,
  };
};

/**
 * Sign in from the opt in window
 */
export const signIn = (): QueryBarThunkAction<Promise<void>> => {
  return async (dispatch, getState, { atlasService }) => {
    if (getState().atlasSignIn.state === 'success') {
      return;
    }
    dispatch(cancelSignIn());
    const { id, signal } = getAbortSignal();
    dispatch({ type: AtlasSignInActions.Start, id });
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
    } catch (err) {
      // Only handle error state if sign in wasn't aborted by the user
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
    }
  };
};

export const closeSignInModal = (): QueryBarThunkAction<void> => {
  return (dispatch) => {
    dispatch(cancelSignIn());
    dispatch({ type: AtlasSignInActions.CloseSignInModal });
  };
};

export const cancelSignIn = (): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    if (['in-progress', 'restoring'].includes(getState().atlasSignIn.state)) {
      abort(getState().atlasSignIn.currentAttemptId);
      dispatch({ type: AtlasSignInActions.Cancel });
    }
  };
};

export default reducer;
