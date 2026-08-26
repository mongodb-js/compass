import React, { useMemo } from 'react';
import {
  performSignInAttempt,
  signOut,
  type SignInAttemptResult,
  type AtlasSignInState,
} from './atlas-signin-reducer';
import type { ReactReduxContextValue, TypedUseSelectorHook } from 'react-redux';
import {
  createDispatchHook,
  createSelectorHook,
  shallowEqual,
} from 'react-redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import type { AtlasAuthService, AtlasUserInfo } from '../provider';
import type {
  AtlasSignInEntrypoint,
  TrackFunction,
} from '@mongodb-js/compass-telemetry';

export const AtlasSignInStoreContext = React.createContext<
  ReactReduxContextValue<AtlasSignInState>
  // @ts-expect-error not possible to correctly pass default value here
>(null);

const useSelector: TypedUseSelectorHook<AtlasSignInState> = createSelectorHook(
  AtlasSignInStoreContext
);

type AtlasSignInDispatch = ThunkDispatch<
  AtlasSignInState,
  { atlasAuthService: AtlasAuthService; track: TrackFunction },
  AnyAction
>;

const useDispatch: () => AtlasSignInDispatch = createDispatchHook(
  AtlasSignInStoreContext
);

export type AtlasSignInStatus = {
  user: AtlasUserInfo | null;
  state:
    | 'initial'
    | 'restoring'
    | 'unauthenticated'
    | 'in-progress'
    | 'error'
    | 'canceled'
    | 'timed-out'
    | 'success';
};

export function useAtlasSignInStatus() {
  return useSelector(
    (s): AtlasSignInStatus => ({
      user: s.state === 'success' ? s.userInfo : null,
      state: s.state,
    }),
    shallowEqual
  );
}

export type AtlasLoginActions = {
  signOut: () => Promise<void>;
  signIn: (opts?: {
    entrypoint?: AtlasSignInEntrypoint;
  }) => Promise<SignInAttemptResult>;
};

export function useAtlasLoginActions(): AtlasLoginActions {
  const dispatch = useDispatch();
  return useMemo(
    () => ({
      signOut: () => dispatch(signOut()),
      signIn: ({ entrypoint }: { entrypoint?: AtlasSignInEntrypoint } = {}) =>
        dispatch(performSignInAttempt({ entrypoint })),
    }),
    [dispatch]
  );
}
