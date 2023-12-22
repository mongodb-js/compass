import React from 'react';
import type {
  MapStateToProps,
  ReactReduxContextValue,
  TypedUseSelectorHook,
} from 'react-redux';
import {
  connect as reduxConnect,
  Provider as ReduxProvider,
  createStoreHook,
  createDispatchHook,
  createSelectorHook,
} from 'react-redux';
import type { AnyAction, Store } from 'redux';
import type { ThunkActionDispatch } from 'redux-thunk';
import type { RootState } from './query-bar-store';

type QueryBarStore = Store<RootState, AnyAction> & {
  dispatch: ThunkActionDispatch<any>;
};

export const QueryBarStoreContext = React.createContext<
  ReactReduxContextValue<RootState>
  // @ts-expect-error literally impossible for us to pass the store here even
  // though redux types expect it. This is covered by runtime check though, so
  // if somehow the store is not getting passed to a correct context, app will
  // immediately crash
>(null);

export const Provider: typeof ReduxProvider = ({ children, store }) => {
  return (
    <ReduxProvider store={store} context={QueryBarStoreContext as any}>
      {children}
    </ReduxProvider>
  );
};

export const useStore = createStoreHook(
  QueryBarStoreContext
) as () => QueryBarStore;

export const useDispatch = createDispatchHook(
  QueryBarStoreContext
) as () => QueryBarStore['dispatch'];

export const useSelector: TypedUseSelectorHook<RootState> =
  createSelectorHook(QueryBarStoreContext);

export const connect = ((
  mapState: MapStateToProps<unknown, unknown, unknown>,
  mapDispatch = null,
  mergeProps = null
) =>
  reduxConnect(mapState, mapDispatch, mergeProps, {
    context: QueryBarStoreContext,
  })) as typeof reduxConnect;
