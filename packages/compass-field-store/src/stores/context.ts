import React from 'react';
import type { ReactReduxContextValue, TypedUseSelectorHook } from 'react-redux';
import { createSelectorHook, createDispatchHook } from 'react-redux';
import { type ConnectionNamespacesState } from '../modules';
import type { activatePlugin } from './store';

export const FieldStoreContext = React.createContext<
  ReactReduxContextValue<ConnectionNamespacesState>
>(
  // @ts-expect-error react-redux types
  null
);

type Dispatch = ReturnType<typeof activatePlugin>['store']['dispatch'];

export const useDispatch = createDispatchHook(
  FieldStoreContext
) as () => Dispatch;

export const useSelector: TypedUseSelectorHook<ConnectionNamespacesState> =
  createSelectorHook(FieldStoreContext);
