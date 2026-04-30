import { createContext, useContext } from 'react';
import type { GridStore } from './grid-store';

/**
 * The grid store is still backed by Reflux, separately from the redux store.
 * It is provided to components via this context so that they don't need to
 * receive a reference to the redux store object itself.
 */
export const GridStoreContext = createContext<GridStore | null>(null);

export function useGridStore(): GridStore {
  const store = useContext(GridStoreContext);
  if (!store) {
    throw new Error(
      'GridStoreContext is missing — make sure the component is rendered inside the CompassDocuments plugin.'
    );
  }
  return store;
}
