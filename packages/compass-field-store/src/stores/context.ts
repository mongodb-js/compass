import React from 'react';
import type { ReactReduxContextValue, TypedUseSelectorHook } from 'react-redux';
import { createSelectorHook, createDispatchHook } from 'react-redux';
import { type ConnectionNamespacesState } from '../modules';

export const FieldStoreContext = React.createContext<
  ReactReduxContextValue<ConnectionNamespacesState>
>(
  // @ts-expect-error react-redux types
  null
);

export const useDispatch = createDispatchHook(FieldStoreContext);

export const useSelector: TypedUseSelectorHook<ConnectionNamespacesState> =
  createSelectorHook(FieldStoreContext);
