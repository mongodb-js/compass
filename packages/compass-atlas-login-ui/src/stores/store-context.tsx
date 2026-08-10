import React, { useMemo } from 'react';
import type { ReactReduxContextValue } from 'react-redux';
import { createSelectorHook, createDispatchHook } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { AtlasUserInfo } from '@mongodb-js/atlas-service/provider';
import {
  disconnect,
  signIn,
  type AtlasLoginState,
  type AtlasLoginStore,
} from './store-redux';

export const AtlasLoginStoreContext = React.createContext<
  ReactReduxContextValue<AtlasLoginState>
  // @ts-expect-error not possible to correctly pass default value here
>(null);

const useSelector: TypedUseSelectorHook<AtlasLoginState> = createSelectorHook(
  AtlasLoginStoreContext
);
const useDispatch = createDispatchHook(
  AtlasLoginStoreContext
) as () => AtlasLoginStore['dispatch'];

export function useAtlasSignedInUser(): AtlasUserInfo | null {
  return useSelector((state) => state.userInfo);
}

export type AtlasLoginActions = {
  disconnect: () => void;
  signIn: () => Promise<boolean>;
};

export function useAtlasLoginActions(): AtlasLoginActions {
  const dispatch = useDispatch();
  return useMemo(
    () => ({
      disconnect: () => void dispatch(disconnect()),
      signIn: () => dispatch(signIn()),
    }),
    [dispatch]
  );
}
