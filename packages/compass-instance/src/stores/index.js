const { createStore } = require('redux');

const INITIAL_STATE = {
  status: 'initial',
  error: null,
  isDataLake: false,
  activeTabId: 0,
};

function reducer(state = { tabs: [], ...INITIAL_STATE }, action) {
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
      return { ...state, ...INITIAL_STATE };
    case 'change-tab':
      return { ...state, activeTabId: action.id };
    default:
      return state;
  }
}

const store = createStore(reducer);

store.onActivated = function onActivated(globalAppRegistry) {
  store.dispatch({
    type: 'app-registry-activated',
    appRegistry: globalAppRegistry,
  });

  globalAppRegistry.on('instance-created', ({ instance }) => {
    store.dispatch({ type: 'instance-status-change', instance });
    instance.on('change:status', () => {
      store.dispatch({ type: 'instance-status-change', instance });
    });
  });

  globalAppRegistry.on('instance-destroyed', () => {
    store.dispatch({ type: 'reset' });
  });

  globalAppRegistry.on('open-instance-workspace', (tabName) => {
    if (!tabName) {
      store.dispatch({ type: 'change-tab', id: 0 });
    } else {
      const id = store.getState().tabs.findIndex((tab) => tab.name === tabName);
      if (id !== -1) {
        store.dispatch({ type: 'change-tab', id });
      }
    }
  });
};

module.exports = store;
