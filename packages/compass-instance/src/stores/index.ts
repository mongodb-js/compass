import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import appRegistryReducer from '@mongodb-js/mongodb-redux-common/app-registry';
import type AppRegistry from 'hadron-app-registry';
import type { Role } from 'hadron-app-registry';
import type { Store, AnyAction } from 'redux';

type State = {
  appRegistry: {
    localAppRegistry: AppRegistry | null;
    globalAppRegistry: AppRegistry | null;
  };
  status: 'initial' | 'fetching' | 'refreshing' | 'ready' | 'error';
  error: string | null;
  isDataLake: boolean;
  activeTabId: number;
  tabs: Role[];
};

const INITIAL_STATE: State = {
  appRegistry: {
    localAppRegistry: null,
    globalAppRegistry: null,
  },
  status: 'initial',
  error: null,
  isDataLake: false,
  activeTabId: 0,
  tabs: [],
};

function reducer(
  state: State = { ...INITIAL_STATE },
  action: AnyAction
): State {
  // Bit of a hacky way to be able to use the mongodb-redux-common/app-registry
  // reducer without converting this entire package to the combineReducers()
  // pattern.
  state.appRegistry = appRegistryReducer(state.appRegistry, action);

  switch (action.type) {
    case 'app-registry-activated':
      return {
        ...state,
        tabs: action.appRegistry.getRole('Instance.Tab') ?? [],
      };
    case 'instance-status-change':
      return {
        ...state,
        status: action.instance.status,
        error: action.instance.statusError,
        isDataLake: action.instance.dataLake.isDataLake,
      };
    case 'reset':
      return {
        ...state,
        ...INITIAL_STATE,
        appRegistry: state.appRegistry,
        tabs:
          state.appRegistry.globalAppRegistry?.getRole('Instance.Tab') ?? [],
      };
    case 'change-tab':
      return { ...state, activeTabId: action.id };
    default:
      return state;
  }
}

const _store = createStore(reducer, applyMiddleware(thunk));

type StoreActions<T> = T extends Store<unknown, infer A> ? A : never;

type StoreState<T> = T extends Store<infer S, AnyAction> ? S : never;

export type RootActions = StoreActions<typeof _store>;

export type RootState = StoreState<typeof _store>;

const store = Object.assign(_store, {
  onActivated(globalAppRegistry: AppRegistry) {
    store.dispatch({
      type: 'app-registry-activated',
      appRegistry: globalAppRegistry,
    });
    store.dispatch(
      appRegistryReducer.globalAppRegistryActivated(globalAppRegistry)
    );

    globalAppRegistry.on('instance-created', ({ instance }) => {
      store.dispatch({ type: 'instance-status-change', instance });
      instance.on('change:status', () => {
        store.dispatch({ type: 'instance-status-change', instance });
      });
    });

    globalAppRegistry.on('instance-destroyed', () => {
      store.dispatch({ type: 'reset' });
    });

    globalAppRegistry.on('open-instance-workspace', (tabName: string) => {
      if (!tabName) {
        store.dispatch({ type: 'change-tab', id: 0 });
      } else {
        const id = store
          .getState()
          .tabs.findIndex((tab) => tab.name === tabName);
        if (id !== -1) {
          store.dispatch({ type: 'change-tab', id });
        }
      }
    });
  },
});

export default store;
