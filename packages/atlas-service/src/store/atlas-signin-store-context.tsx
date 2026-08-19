import React, { useMemo } from 'react';
import {
  performSignInAttempt,
  signOut,
  type AtlasSignInState,
} from './atlas-signin-reducer';
import type { ReactReduxContextValue, TypedUseSelectorHook } from 'react-redux';
import { createDispatchHook, createSelectorHook } from 'react-redux';
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

export function useAtlasSignedInUser(): AtlasUserInfo | null {
  return useSelector((state) =>
    state.state === 'success' ? state.userInfo : null
  );
}

/**
 * Whether we know yet if the user is signed in. The signed in state is restored
 * asynchronously on startup, so `useAtlasSignedInUser` returns `null` for an
 * already signed in user until that finishes. Anything that shouldn't act on a
 * false "signed out" (reporting telemetry, for example) should wait for this.
 */
export function useIsAtlasSignInStateResolved(): boolean {
  return useSelector(
    (state) =>
      state.state !== 'initial' &&
      state.state !== 'restoring' &&
      state.state !== 'in-progress'
  );
}

export type AtlasLoginActions = {
  signOut: () => Promise<void>;
  signIn: (opts?: {
    entrypoint?: AtlasSignInEntrypoint;
  }) => Promise<AtlasUserInfo>;
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
