import React from 'react';
import type {
  MapStateToProps,
  ReactReduxContextValue,
  TypedUseSelectorHook,
} from 'react-redux';
import {
  connect as reduxConnect,
  createStoreHook,
  createDispatchHook,
  createSelectorHook,
} from 'react-redux';
import type { configureStore } from '..';
import type { Store } from 'redux';

type WorkspacesStore = ReturnType<typeof configureStore> extends Store<
  infer S,
  infer A
> & { dispatch: infer D }
  ? { state: S; actions: A; dispatch: D }
  : never;

export const WorkspacesStoreContext = React.createContext<
  ReactReduxContextValue<WorkspacesStore['state']>
  // @ts-expect-error literally impossible for us to pass the store here even
  // though redux types expect it. This is covered by runtime check though, so
  // if somehow the store is not getting passed to a correct context, app will
  // immediately crash
>(null);

export const useStore = createStoreHook(
  WorkspacesStoreContext
) as () => ReturnType<typeof configureStore>;

export const useDispatch = createDispatchHook(
  WorkspacesStoreContext
) as () => WorkspacesStore['dispatch'];

export const useSelector: TypedUseSelectorHook<WorkspacesStore['state']> =
  createSelectorHook(WorkspacesStoreContext);

export const connect = ((
  mapState: MapStateToProps<unknown, unknown, unknown>,
  mapDispatch = null,
  mergeProps = null
) =>
  reduxConnect(mapState, mapDispatch, mergeProps, {
    context: WorkspacesStoreContext,
  })) as typeof reduxConnect;
