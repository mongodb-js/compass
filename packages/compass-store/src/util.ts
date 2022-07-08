import {
  AnyAction,
  ThunkAction as _ThunkAction,
  ThunkDispatch as _ThunkDispatch,
  AsyncThunkAction as _AsyncThunkAction,
  createAsyncThunk as _createAsyncThunk,
} from '@reduxjs/toolkit';
import type { TypedUseSelectorHook } from 'react-redux';
import {
  useDispatch as _useDispatch,
  useSelector as _useSelector,
} from 'react-redux';
import toNs from 'mongodb-ns';
import type { ThunkOptions } from './stores/root-store';
import type { RootDispatch, RootState } from './stores/root-store';

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
