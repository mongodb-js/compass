import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactReduxContextValue, TypedUseSelectorHook } from 'react-redux';
import { Provider, createSelectorHook, createStoreHook } from 'react-redux';
import type { AnyAction } from 'redux';
import { createStore } from 'redux';
import type { WorkspaceTab } from '../stores/workspaces';

type TabState = Record<string, Record<string, unknown>>;

const SET_STATE = 'compass-workspaces/workspace-tab-state-provider/SET_STATE';

const CLEANUP_TAB_STATE =
  'compass-workspaces/workspace-tab-state-provider/CLEANUP_TAB_STATE';

const RESET = 'compass-workspaces/workspace-tab-state-provider/RESET';

function createTabStore() {
  return createStore(
    (state: TabState = Object.create(null), action: AnyAction) => {
      if (action.type === SET_STATE) {
        return {
          ...state,
          [action.tabId]: {
            ...state[action.tabId],
            [action.stateId]: action.value,
          },
        };
      }
      if (action.type === CLEANUP_TAB_STATE) {
        delete state[action.tabId];
        return { ...state };
      }
      if (action.type === RESET) {
        return Object.create(null);
      }
      return state;
    }
  );
}

type TabStateStore = ReturnType<typeof createTabStore>;

/**
 * Exported for testing purposes only
 * @internal
 */
export const tabStateStore = createTabStore();

export function cleanupTabState(tabId: string) {
  tabStateStore.dispatch({ type: CLEANUP_TAB_STATE, tabId });
}

export function reset() {
  tabStateStore.dispatch({ type: RESET });
}

export const TabStateStoreContext = React.createContext<
  ReactReduxContextValue<TabState>
>(
  // @ts-expect-error react-redux types are a mess
  null
);

const WorkspaceTabIdContext = React.createContext<string | null>(null);

/**
 * Exported for testing purposes only
 * @internal
 */
export const TabStoreProvider = ({
  children,
}: {
  children: React.ReactChild;
}) => {
  return (
    <Provider context={TabStateStoreContext} store={tabStateStore}>
      {children}
    </Provider>
  );
};

export const WorkspaceTabStateProvider = ({
  id,
  children,
}: {
  id: string;
  children: React.ReactChild;
}) => {
  return (
    <WorkspaceTabIdContext.Provider value={id}>
      <TabStoreProvider>{children}</TabStoreProvider>
    </WorkspaceTabIdContext.Provider>
  );
};

function useWorkspaceTabId() {
  let tabId = useContext(WorkspaceTabIdContext);
  if (!tabId) {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error(
        'Trying to get tab id from React context, but getting `null`. Are you using workspace scoped hooks outside of workspace tab React rendering tree?'
      );
    }
    tabId = 'test-tab-id';
  }
  return tabId;
}

const useStore: () => TabStateStore = createStoreHook(TabStateStoreContext);

const useSelector: TypedUseSelectorHook<TabState> =
  createSelectorHook(TabStateStoreContext);

type SetState<S> = (newState: S | ((prevState: S) => S)) => void;

function selectTabState<S>(state: TabState, tabId: string, key: string) {
  return state[tabId]?.[key] as S;
}

/**
 * useSelector but with a state fallback for testing environment
 */
function useTabStateSelector<S>(
  tabId: string,
  key: string,
  store: TabStateStore
): S {
  try {
    return useSelector((state) => {
      return selectTabState<S>(state, tabId, key);
    });
  } catch (err) {
    // This will throw when Redux provider is not available in the React
    // context. In that case, if we are in the test environment we'll set up our
    // own state update listener to make sure that we can still update the local
    // state of the component. This breaks rules of hooks, but in this scenario
    // the hooks are always called in the same order even when under condition
    if (
      process.env.NODE_ENV === 'test' &&
      /could not find react-redux context value/.test((err as Error).message)
    ) {
      /* eslint-disable react-hooks/rules-of-hooks */
      const [, forceUpdate] = useState({});
      useEffect(() => {
        return store.subscribe(() => {
          forceUpdate({});
        });
      }, [store]);
      return selectTabState(store.getState(), tabId, key);
      /* eslint-enable react-hooks/rules-of-hooks */
    }
    throw err;
  }
}

/**
 * Helper hook to make it easier to manage UI state scoped to the single
 * workspace tab even when it unmounts in React tree. This hook IS NOT SUPPOSED
 * to be used for anything but UI-only state, everything else needs to be part
 * of the corresponding workspace plugin redux stores.
 *
 * @param key Unique state key
 * @param initialState Initial state or a function that returns initial state.
 *                     Only the first initial state value will be set if
 *                     multiple hooks are using the same key
 */
export function useTabState<S>(
  key: string,
  initialState: S | (() => S)
): [S, SetState<S>] {
  const keyRef = useRef(key);
  const tabIdRef = useRef(useWorkspaceTabId());
  const storeRef = useRef(
    (() => {
      try {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useStore();
      } catch (err) {
        // This will throw when Redux provider is not available in the React
        // context. In that case, if we are in the test environment we'll create
        // a new store instance to make sure that state changes are not actually
        // persisted between test suites but the tests are still able to run
        if (
          process.env.NODE_ENV === 'test' &&
          /could not find react-redux context value/.test(
            (err as Error).message
          )
        ) {
          return createTabStore();
        }
        throw err;
      }
    })()
  );
  const setState: SetState<S> = useCallback((newState) => {
    const newVal =
      typeof newState === 'function'
        ? (newState as (prevState: S) => S)(
            selectTabState<S>(
              storeRef.current.getState(),
              tabIdRef.current,
              keyRef.current
            )
          )
        : newState;
    storeRef.current.dispatch({
      type: SET_STATE,
      tabId: tabIdRef.current,
      stateId: keyRef.current,
      value: newVal,
    });
  }, []);
  const handledInitialState = useRef(false);
  if (handledInitialState.current === false) {
    handledInitialState.current = true;
    if (
      !Object.prototype.hasOwnProperty.call(
        storeRef.current.getState()[tabIdRef.current] ?? {},
        keyRef.current
      )
    ) {
      // NB: This might look like it breaks the rules of hooks because we are
      // calling `setState` inside render, but this sets state on the Redux
      // store, not React state and we haven't run `useSelector` yet so it
      // doesn't know that state might've changed, so this will not trigger a
      // re-render while another render is in progress.
      setState(initialState);
    }
  }
  const state = useTabStateSelector<S>(
    tabIdRef.current,
    keyRef.current,
    storeRef.current
  );
  return [state, setState];
}

export type WorkspaceCloseState = { canClose: boolean; canReplace: boolean };

/**
 * Workspace tab onClose handler. After being registered, this function will be
 * called when there will be an attempt to close the tab, either by replacing it
 * with the new tab or due to user clicking a close button on the tab. This
 * method can return three distinct states to control the closing behavior
 */
export type WorkspaceCloseHandler = () => WorkspaceCloseState;

const WorkspaceTabCloseHandlerMap = new Map<string, WorkspaceCloseHandler[]>();

export const resolveTabCloseState = (
  tab: WorkspaceTab
): WorkspaceCloseState => {
  const state = { canClose: true, canReplace: true };
  for (const handler of WorkspaceTabCloseHandlerMap.get(tab.id) ?? []) {
    const res = handler();
    state.canClose = res.canClose === false ? res.canClose : state.canClose;
    state.canReplace =
      res.canReplace === false ? res.canReplace : state.canReplace;
  }
  return state;
};

export const setTabCloseHandler = (
  tabId: string,
  handler: WorkspaceCloseHandler
) => {
  const handlers = WorkspaceTabCloseHandlerMap.get(tabId) ?? [];
  WorkspaceTabCloseHandlerMap.set(tabId, handlers.concat(handler));
  return () => {
    cleanupTabCloseHandler(tabId, handler);
  };
};

export const cleanupTabCloseHandler = (
  tabId?: string,
  handler?: WorkspaceCloseHandler
) => {
  if (handler && tabId) {
    const handlers = (WorkspaceTabCloseHandlerMap.get(tabId) ?? []).filter(
      (fn) => {
        return fn !== handler;
      }
    );
    WorkspaceTabCloseHandlerMap.set(tabId, handlers);
  } else if (tabId) {
    WorkspaceTabCloseHandlerMap.delete(tabId);
  } else {
    WorkspaceTabCloseHandlerMap.clear();
  }
};

/**
 * Tab workspaces can register a callback that will be called before tab will be
 * closed (either by user clicking close button, or due to other tab replacing
 * the content). The callback can change the default closing behaviour by
 * returning a special object
 *
 * @example
 * useOnTabCloseHandler(function () {
 *   return { canClose: true, canReplace: false }
 * })
 */
export function useOnTabCloseHandler(handler: WorkspaceCloseHandler) {
  const tabId = useWorkspaceTabId();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    const onClose: WorkspaceCloseHandler = () => {
      return handlerRef.current();
    };
    return setTabCloseHandler(tabId, onClose);
  }, [tabId]);
}

export function useRegisterTabCloseHandler() {
  let tabId: string | undefined;
  try {
    // We are not breaking rules of hooks here, this method will either always
    // fail or always return a value when rendered in a certain spot in the
    // application
    // eslint-disable-next-line react-hooks/rules-of-hooks
    tabId = useWorkspaceTabId();
  } catch {
    // do nothing, we are just outside of the workspace tab tree
  }

  if (tabId) {
    return setTabCloseHandler.bind(null, tabId);
  }
}
