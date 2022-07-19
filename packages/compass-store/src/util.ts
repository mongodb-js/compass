import type {
  AnyAction,
  ThunkAction as _ThunkAction,
  AsyncThunkAction as _AsyncThunkAction,
} from '@reduxjs/toolkit';
import { createAsyncThunk as _createAsyncThunk } from '@reduxjs/toolkit';
import type { TypedUseSelectorHook } from 'react-redux';
import {
  useDispatch as _useDispatch,
  useSelector as _useSelector,
} from 'react-redux';
import toNs from 'mongodb-ns';
import type { ThunkOptions } from './redux/root-store';
import type { RootDispatch, RootState } from './redux/root-store';
import type { IAnyStateTreeNode, Instance } from 'mobx-state-tree';
import { getEnv, types } from 'mobx-state-tree';
import type { Services } from './mobx-state-tree/root-store';

export type LoadingStatus =
  | 'Initial'
  | 'Fetching'
  | 'Refreshing'
  | 'Ready'
  | 'Error'
  | 'Stale';

export const isReady = (status: LoadingStatus): boolean => status === 'Ready';

export const isError = (status: LoadingStatus): boolean => status === 'Error';

export const isLoaded = (status: LoadingStatus): boolean =>
  status === 'Ready' || status === 'Error';

export const shouldFetch = (status: LoadingStatus): boolean =>
  status === 'Initial' || status === 'Stale';

// Typed version of the original useDispatch
export const useDispatch = (): RootDispatch => _useDispatch<RootDispatch>();

// Typed version of the original useSelector
export const useSelector: TypedUseSelectorHook<RootState> = _useSelector;

export type CreateAsyncThunkActionCreator<Returned, ThunkArg> =
  typeof _createAsyncThunk<Returned, ThunkArg, ThunkOptions>;

export type AsyncThunkActionCreator<Returned, ThunkArg> = ReturnType<
  CreateAsyncThunkActionCreator<Returned, ThunkArg>
>;

export type AsyncThunkAction<Returned, ThunkArg> = _AsyncThunkAction<
  Returned,
  ThunkArg,
  ThunkOptions
>;

// Typed version of the original createAsyncThunk
export const createAsyncThunk = <Returned, ThunkArg>(
  ...args: Parameters<CreateAsyncThunkActionCreator<Returned, ThunkArg>>
): AsyncThunkActionCreator<Returned, ThunkArg> => {
  return _createAsyncThunk(...args);
};

export type ThunkAction<Returned> = _ThunkAction<
  Returned,
  ThunkOptions['state'],
  ThunkOptions['extra'],
  AnyAction
>;

const kDebouncedAction = Symbol('debouncedAction');

class InflightActionManager {
  private actions = new Map<
    string,
    Promise<unknown> & { abort: AbortController['abort'] }
  >();

  isDebouncedAction(action: any): boolean {
    return Boolean(action[kDebouncedAction]);
  }

  debounce<Returned, ThunkArg>(
    fn: AsyncThunkActionCreator<Returned, ThunkArg>
  ): ((
    // If there are no arguments for the thunk, use the action prefix as id. If
    // thunk arg is string or number, we can use it as id without asking for a
    // special id argument. In all other cases id needs to be provided
    // explicitly
    ...args: ThunkArg extends undefined
      ? []
      : ThunkArg extends string
      ? [string]
      : ThunkArg extends number
      ? [number]
      : [string, ThunkArg]
  ) => ReturnType<typeof fn>) &
    Pick<typeof fn, 'fulfilled' | 'pending' | 'rejected' | 'typePrefix'> {
    const creator = Object.assign((id: string | ThunkArg, arg?: ThunkArg) => {
      if (typeof arg === 'undefined') {
        arg = id as ThunkArg;
      }
      const actionId = [fn.typePrefix, id].filter(Boolean).join('/');
      if (this.actions.has(actionId)) {
        return this.actions.get(actionId);
      }
      return (dispatch: RootDispatch) => {
        const dispatchedThunk = dispatch(fn(arg as ThunkArg));
        dispatchedThunk.finally(() => {
          this.actions.delete(actionId);
        });
        (dispatchedThunk as any)[kDebouncedAction] = true;
        this.actions.set(actionId, dispatchedThunk);
        return dispatchedThunk;
      };
    }, fn);

    // @ts-expect-error really not sure how to type this properly
    return creator;
  }
}

export const actionManager = ((globalThis as any).actionManager =
  new InflightActionManager());

const Inflight = new WeakMap();

export function debounceInflight<ReturnValue extends Promise<unknown>>(
  fn: (...args: []) => ReturnValue
) {
  return function (...args: []): ReturnValue {
    if (Inflight.has(fn)) {
      return Inflight.get(fn);
    }
    const promise = fn(...args);
    promise.finally(() => {
      Inflight.delete(fn);
    });
    Inflight.set(fn, promise);
    return promise;
  };
}

type NS = ReturnType<typeof toNs>;

const NamespaceMap = new Map<string, NS>();

export const toNS = (namespace: string): NS => {
  if (NamespaceMap.has(namespace)) {
    return NamespaceMap.get(namespace)!;
  }
  const ns = toNs(namespace);
  NamespaceMap.set(namespace, ns);
  return ns;
};

export const LoadableModel = types.model({
  status: types.optional(
    types.enumeration([
      'Initial',
      'Fetching',
      'Refreshing',
      'Ready',
      'Error',
      'Stale',
    ]),
    'Initial'
  ),
  error: types.maybeNull(types.string),
});

export type Loadable = Instance<typeof LoadableModel>;

export function getServices(target: IAnyStateTreeNode): Services {
  return getEnv(target);
}

// Used in redux reducers so that we only update ids lists state if the
// collection we received has a different set of items (disregarding the order)
// otherwise recreating id lists causes performance issues in the rendering
export function areSameIds(a: string[], b: string[]): boolean {
  const _a = [...a].sort().join('');
  const _b = [...b].sort().join('');
  return _a === _b;
}

// Used for sorted state to only update it when the order changes
export function areSameIdsOrdered(a: string[], b: string[]): boolean {
  const _a = a.join('');
  const _b = b.join('');
  return _a === _b;
}
