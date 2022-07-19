import { createContext, useContext } from 'react';
import type { RootInstance } from './root-store';

export const RootStoreContext = createContext<null | RootInstance>(null);

export const useRootStoreContext = (): RootInstance => {
  const store = useContext(RootStoreContext);
  if (!store) {
    throw new Error('Expected root store to exist');
  }
  return store;
};
