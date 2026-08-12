import React, { useMemo } from 'react';
import {
  disconnect,
  performSignInAttempt,
  type AtlasSignInState,
} from './atlas-signin-reducer';
import type { ReactReduxContextValue, TypedUseSelectorHook } from 'react-redux';
import { createDispatchHook, createSelectorHook } from 'react-redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import type { AtlasAuthService, AtlasUserInfo } from '../provider';

export const AtlasSignInStoreContext = React.createContext<
  ReactReduxContextValue<AtlasSignInState>
  // @ts-expect-error not possible to correctly pass default value here
>(null);

const useSelector: TypedUseSelectorHook<AtlasSignInState> = createSelectorHook(
  AtlasSignInStoreContext
);

type AtlasSignInDispatch = ThunkDispatch<
  AtlasSignInState,
  { atlasAuthService: AtlasAuthService },
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

export type AtlasLoginActions = {
  disconnect: () => Promise<void>;
  signIn: () => Promise<boolean>;
};

export function useAtlasLoginActions(): AtlasLoginActions {
  const dispatch = useDispatch();
  return useMemo(
    () => ({
      disconnect: () => dispatch(disconnect()),
      // `performSignInAttempt` manages the sign-in attempt lifecycle and
      // resolves with the user info on success / rejects on failure, so we
      // derive the boolean outcome directly from it.
      signIn: () =>
        dispatch(performSignInAttempt())
          .then(() => true)
          .catch(() => false),
    }),
    [dispatch]
  );
}
