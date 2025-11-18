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
export const TabStoreProvider: React.FunctionComponent = ({ children }) => {
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

export function useWorkspaceTabId() {
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
