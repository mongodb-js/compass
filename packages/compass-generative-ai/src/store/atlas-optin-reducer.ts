import type { Action, AnyAction, Reducer } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import { throwIfAborted } from '@mongodb-js/compass-utils';
import type { AtlasAiService } from '../atlas-ai-service';
import type { PreferencesAccess } from 'compass-preferences-model';
import type { RootState } from './atlas-ai-store';
import { isAction } from '../utils/util';

type AttemptState = {
  id: number;
  controller: AbortController;
  promise: Promise<void>;
  resolve: () => void;
  reject: (reason?: any) => void;
};

export type AtlasOptInState = {
  error: string | null;
  isModalOpen: boolean;
  attemptId: number | null;
  state: 'initial' | 'in-progress' | 'error' | 'canceled' | 'optin-success';
};

export type GenAIAtlasOptInThunkAction<
  R,
  A extends AnyAction = AnyAction
> = ThunkAction<
  R,
  RootState,
  { atlasAiService: AtlasAiService; preferences: PreferencesAccess },
  A
>;

export const enum AtlasOptInActions {
  OpenOptInModal = 'compass-generative-ai/atlas-optin/OpenOptInModal',
  CloseOptInModal = 'compass-generative-ai/atlas-optin/CloseOptInModal',
  AttemptStart = 'compass-generative-ai/atlas-optin/AttemptStart',
  AttemptEnd = 'compass-generative-ai/atlas-optin/AttemptEnd',
  Start = 'compass-generative-ai/atlas-optin/AtlasOptInStart',
  OptInSuccess = 'compass-generative-ai/atlas-optin/AtlasOptInSuccess',
  Error = 'compass-generative-ai/atlas-optin/AtlasOptInError',
  Cancel = 'compass-generative-ai/atlas-optin/AtlasOptInCancel',
}

export type AtlasOptInOpenModalAction = {
  type: AtlasOptInActions.OpenOptInModal;
};

export type AtlasOptInCloseModalAction = {
  type: AtlasOptInActions.CloseOptInModal;
};

export type AtlasOptInAttemptStartAction = {
  type: AtlasOptInActions.AttemptStart;
  attemptId: number;
};

export type AtlasOptInAttemptEndAction = {
  type: AtlasOptInActions.AttemptEnd;
  attemptId: number;
};

export type AtlasOptInStartAction = {
  type: AtlasOptInActions.Start;
};

export type AtlasOptInSuccessAction = {
  type: AtlasOptInActions.OptInSuccess;
};

export type AtlasOptInErrorAction = {
  type: AtlasOptInActions.Error;
  error: string;
};

export type AtlasOptInCancelAction = { type: AtlasOptInActions.Cancel };

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
      'Trying to get the state for a non-existing opt in attempt'
    );
  }
  return attemptState;
}

const optInReducer: Reducer<AtlasOptInState, Action> = (
  state = { ...INITIAL_STATE },
  action
) => {
  if (
    isAction<AtlasOptInAttemptStartAction>(
      action,
      AtlasOptInActions.AttemptStart
    )
  ) {
    return {
      ...state,
      attemptId: action.attemptId,
    };
  }

  if (
    isAction<AtlasOptInAttemptEndAction>(action, AtlasOptInActions.AttemptEnd)
  ) {
    return {
      ...state,
      attemptId: null,
    };
  }

  if (isAction<AtlasOptInStartAction>(action, AtlasOptInActions.Start)) {
    return { ...state, state: 'in-progress' };
  }

  if (
    isAction<AtlasOptInSuccessAction>(action, AtlasOptInActions.OptInSuccess)
  ) {
    return {
      ...state,
      state: 'optin-success',
      error: null,
      isModalOpen: false,
    };
  }

  if (isAction<AtlasOptInErrorAction>(action, AtlasOptInActions.Error)) {
    return {
      ...state,
      state: 'error',
      error: action.error,
      isModalOpen: false,
    };
  }

  if (isAction<AtlasOptInCancelAction>(action, AtlasOptInActions.Cancel)) {
    return { ...INITIAL_STATE, state: 'canceled' };
  }

  if (
    isAction<AtlasOptInOpenModalAction>(
      action,
      AtlasOptInActions.OpenOptInModal
    )
  ) {
    return { ...state, isModalOpen: true };
  }

  if (
    isAction<AtlasOptInCloseModalAction>(
      action,
      AtlasOptInActions.CloseOptInModal
    )
  ) {
    return { ...state, isModalOpen: false };
  }

  return state;
};

const startAttempt = (
  fn: () => void
): GenAIAtlasOptInThunkAction<AttemptState> => {
  return (dispatch, getState) => {
    if (getState().optIn.attemptId) {
      throw new Error(
        "Can't start opt in with prompt while another opt in attempt is in progress"
      );
    }
    //if pref set to false then call an opt in function then show it
    const attempt = getAttempt();
    dispatch({ type: AtlasOptInActions.AttemptStart, attemptId: attempt.id });
    attempt.promise
      .finally(() => {
        dispatch({
          type: AtlasOptInActions.AttemptEnd,
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

export const optIntoGenAIWithModalPrompt = ({
  signal,
}: { signal?: AbortSignal } = {}): GenAIAtlasOptInThunkAction<
  Promise<void>
> => {
  return (dispatch, getState, { preferences }) => {
    // Nothing to do if we already opted in.
    const { state } = getState().optIn;
    if (
      (state === 'optin-success' ||
        preferences.getPreferences().optInDataExplorerGenAIFeatures) &&
      preferences.getPreferences().enableGenAIFeaturesAtlasProject
    ) {
      return Promise.resolve();
    }
    const attempt = dispatch(
      startAttempt(() => {
        dispatch(openOptInModal());
      })
    );
    signal?.addEventListener('abort', () => {
      dispatch(closeOptInModal(signal.reason));
    });
    return attempt.promise;
  };
};

export const optIn = (): GenAIAtlasOptInThunkAction<Promise<void>> => {
  return async (dispatch, getState, { atlasAiService }) => {
    if (['in-progress', 'optin-success'].includes(getState().optIn.state)) {
      return;
    }
    const { attemptId } = getState().optIn;
    if (attemptId === null) {
      return;
    }
    const {
      controller: { signal },
      resolve,
      reject,
    } = getAttempt(getState().optIn.attemptId);
    dispatch({
      type: AtlasOptInActions.Start,
    });

    try {
      throwIfAborted(signal);
      await atlasAiService.optIntoGenAIFeaturesAtlas();
      dispatch(atlasAiServiceOptedIn());
      resolve();
    } catch (err) {
      if (signal.aborted) {
        return;
      }
      dispatch({
        type: AtlasOptInActions.Error,
        error: (err as Error).message,
      });
      reject(err);
    }
  };
};

export const openOptInModal = () => {
  return { type: AtlasOptInActions.OpenOptInModal };
};

export const closeOptInModal = (
  reason?: any
): GenAIAtlasOptInThunkAction<void> => {
  return (dispatch) => {
    dispatch(cancelOptIn(reason));
    dispatch({ type: AtlasOptInActions.CloseOptInModal });
  };
};

export const cancelOptIn = (reason?: any): GenAIAtlasOptInThunkAction<void> => {
  return (dispatch, getState) => {
    // Can't cancel opt in after the flow was finished indicated by current
    // attempt id being set to null.
    if (getState().optIn.attemptId === null) {
      return;
    }
    const attempt = getAttempt(getState().optIn.attemptId);
    attempt.controller.abort();
    attempt.reject(reason ?? attempt.controller.signal.reason);
    dispatch({ type: AtlasOptInActions.Cancel });
  };
};

export const atlasAiServiceOptedIn = () => ({
  type: AtlasOptInActions.OptInSuccess,
});

export default optInReducer;
