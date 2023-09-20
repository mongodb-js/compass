import React from 'react';
import type { AnyAction, Reducer } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import AppRegistry from 'hadron-app-registry';
import { ObjectId } from 'bson';
import type { CollectionMetadata } from 'mongodb-collection-model';
import type { DataService } from 'mongodb-data-service';
import toNs from 'mongodb-ns';

export type CollectionTab = {
  id: string;
  namespace: string;
  type: string;
  selectedSubTabName: string;
  // TODO(COMPASS-7020): this doesn't belong in the state, but this is how
  // collection tabs currently work, this will go away when we switch to using
  // new compass-workspace plugin in combination with registerHadronPlugin
  localAppRegistry: AppRegistry;
  component: React.ReactElement;
};

export type CollectionTabsState = {
  tabs: CollectionTab[];
  activeTabId: string | null;
};

enum CollectionTabsActions {
  OpenCollection = 'compass-collection/OpenCollection',
  OpenCollectionInNewTab = 'compass-collection/OpenCollectionInNewTab',
  SelectTab = 'compass-collection/SelectTab',
  MoveTab = 'compass-collection/MoveTab',
  SelectPreviousTab = 'compass-collection/SelectPreviousTab',
  SelectNextTab = 'compass-collection/SelectNextTab',
  CloseTab = 'compass-collection/CloseTab',
  SubtabChanged = 'compass-colection/SubtabChanged',
  CollectionDropped = 'compass-collection/CollectionDropped',
  DatabaseDropped = 'compass-collection/DatabaseDropped',
  DataServiceConnected = 'compass-collection/DataServiceConnected',
  DataServiceDisconnected = 'compass-collection/DataServiceDisconnected',
}

type CollectionTabsThunkAction<
  ReturnType,
  Action extends AnyAction = AnyAction
> = ThunkAction<
  ReturnType,
  CollectionTabsState,
  {
    globalAppRegistry: AppRegistry;
    dataService: DataService | null;
  },
  Action
>;

const reducer: Reducer<CollectionTabsState> = (
  state = { tabs: [], activeTabId: null },
  action
) => {
  if (action.type === CollectionTabsActions.OpenCollection) {
    const activeTabIndex = getActiveTabIndex(state);
    if (activeTabIndex !== -1) {
      const newTabs = [...state.tabs];
      newTabs.splice(activeTabIndex, 1, action.tab);
      return {
        activeTabId: action.tab.id,
        tabs: newTabs,
      };
    }
    return {
      activeTabId: action.tab.id,
      tabs: [...state.tabs, action.tab],
    };
  }
  if (action.type === CollectionTabsActions.OpenCollectionInNewTab) {
    return {
      activeTabId: action.tab.id,
      tabs: [...state.tabs, action.tab],
    };
  }
  if (action.type === CollectionTabsActions.SelectTab) {
    const newActiveTab = state.tabs[action.index];
    return {
      ...state,
      activeTabId: newActiveTab.id ?? state.activeTabId,
    };
  }
  if (action.type === CollectionTabsActions.SelectNextTab) {
    const newActiveTabIndex =
      (getActiveTabIndex(state) + 1) % state.tabs.length;
    const newActiveTab = state.tabs[newActiveTabIndex];
    return {
      ...state,
      activeTabId: newActiveTab.id ?? state.activeTabId,
    };
  }
  if (action.type === CollectionTabsActions.SelectPreviousTab) {
    const currentActiveTabIndex = getActiveTabIndex(state);
    const newActiveTabIndex =
      getActiveTabIndex(state) === 0
        ? state.tabs.length - 1
        : currentActiveTabIndex - 1;
    const newActiveTab = state.tabs[newActiveTabIndex];
    return {
      ...state,
      activeTabId: newActiveTab.id ?? state.activeTabId,
    };
  }
  if (action.type === CollectionTabsActions.MoveTab) {
    const newTabs = [...state.tabs];
    newTabs.splice(action.toIndex, 0, newTabs.splice(action.fromIndex, 1)[0]);
    return {
      ...state,
      tabs: newTabs,
    };
  }
  if (action.type === CollectionTabsActions.CloseTab) {
    const tabToClose = state.tabs[action.index];
    const tabIndex = state.tabs.findIndex((tab) => tab.id === tabToClose.id);
    const newTabs = [...state.tabs];
    newTabs.splice(action.index, 1);
    const newActiveTabId =
      tabToClose.id === state.activeTabId
        ? // We follow standard browser behavior with tabs on how we handle
          // which tab gets activated if we close the active tab. If the active
          // tab is the last tab, we activate the one before it, otherwise we
          // activate the next tab.
          (state.tabs[tabIndex + 1] ?? newTabs[newTabs.length - 1])?.id ?? null
        : state.activeTabId;
    return {
      activeTabId: newActiveTabId,
      tabs: newTabs,
    };
  }
  if (action.type === CollectionTabsActions.CollectionDropped) {
    const newTabs = state.tabs.filter((tab) => {
      return tab.namespace !== action.namespace;
    });
    const isActiveTabRemoved = !newTabs.some((tab) => {
      return tab.id === state.activeTabId;
    });
    return {
      activeTabId: isActiveTabRemoved
        ? newTabs[0]?.id ?? null
        : state.activeTabId,
      tabs: newTabs,
    };
  }
  if (action.type === CollectionTabsActions.DatabaseDropped) {
    const { database } = toNs(action.namespace);
    const newTabs = state.tabs.filter((tab) => {
      const { database: tabDatabase } = toNs(tab.namespace);
      return tabDatabase !== database;
    });
    const isActiveTabRemoved = !newTabs.some((tab) => {
      return tab.id === state.activeTabId;
    });
    return {
      activeTabId: isActiveTabRemoved
        ? newTabs[0]?.id ?? null
        : state.activeTabId,
      tabs: newTabs,
    };
  }
  if (
    action.type === CollectionTabsActions.DataServiceConnected ||
    action.type === CollectionTabsActions.DataServiceDisconnected
  ) {
    return {
      activeTabId: null,
      tabs: [],
    };
  }
  if (action.type === CollectionTabsActions.SubtabChanged) {
    const tabIndex = state.tabs.findIndex((tab) => {
      return tab.id === action.id;
    });
    const tab = state.tabs[tabIndex];
    const newTabs = [...state.tabs];
    newTabs.splice(tabIndex, 1, { ...tab, selectedSubTabName: action.name });
    return {
      ...state,
      tabs: newTabs,
    };
  }
  return state;
};

const subtabChanged = (id: string, name: string) => {
  return { type: CollectionTabsActions.SubtabChanged, id, name };
};

const createNewTab = (
  collectionMetadata: CollectionMetadata
): CollectionTabsThunkAction<CollectionTab> => {
  return (dispatch, getState, { globalAppRegistry, dataService }) => {
    const collectionTabRole = globalAppRegistry.getRole(
      'CollectionTab.Content'
    )?.[0];
    if (!collectionTabRole || !collectionTabRole.configureStore) {
      throw new Error(
        "Can't open a colleciton tab if collection tab role is not registered"
      );
    }
    if (!dataService) {
      throw new Error(
        "Can't open a collection tab while data service is not connected"
      );
    }
    const localAppRegistry = new AppRegistry();
    const store = collectionTabRole.configureStore({
      dataService,
      globalAppRegistry,
      localAppRegistry,
      ...collectionMetadata,
    });
    const component = React.createElement(collectionTabRole.component, {
      store,
    });
    const tab: CollectionTab = {
      id: new ObjectId().toHexString(),
      selectedSubTabName: store.getState().currentTab,
      namespace: collectionMetadata.namespace,
      type: collectionMetadata.isTimeSeries
        ? 'timeseries'
        : collectionMetadata.isReadonly
        ? 'view'
        : 'collection',
      localAppRegistry,
      component,
    };
    localAppRegistry.on('subtab-changed', (name: string) => {
      dispatch(subtabChanged(tab.id, name));
    });
    return tab;
  };
};

export const openCollectionInNewTab = (
  // NB: now that we have clean separation between tabs and collection content,
  // we can make collection fetch its own metadata without the need for this to
  // happen in instance store
  collectionMetadata: CollectionMetadata
): CollectionTabsThunkAction<void> => {
  return (dispatch) => {
    const tab = dispatch(createNewTab(collectionMetadata));
    dispatch({ type: CollectionTabsActions.OpenCollectionInNewTab, tab });
  };
};

export const openCollection = (
  collectionMetadata: CollectionMetadata
): CollectionTabsThunkAction<void> => {
  return (dispatch, getState) => {
    // If current active tab namespace is the same, do nothing
    if (getActiveTab(getState())?.namespace === collectionMetadata.namespace) {
      return;
    }
    const tab = dispatch(createNewTab(collectionMetadata));
    dispatch({ type: CollectionTabsActions.OpenCollection, tab });
  };
};

export const selectTabByIndex = (
  index: number
): CollectionTabsThunkAction<void> => {
  return (dispatch, getState, { globalAppRegistry }) => {
    dispatch({ type: CollectionTabsActions.SelectTab, index });
    // NB: this will cause `openTab` action to dispatch, but it will be a no-op
    // as we are "selecting" already selected namespace. This is needed so that
    // other parts of the application can sync namespace correctly when user
    // switches between multiple open tabs
    globalAppRegistry.emit('collection-workspace-select-namespace', {
      ns: getActiveTab(getState())?.namespace,
    });
  };
};

export const selectPreviousTab = (): CollectionTabsThunkAction<void> => {
  return (dispatch, getState, { globalAppRegistry }) => {
    dispatch({ type: CollectionTabsActions.SelectPreviousTab });
    globalAppRegistry.emit('collection-workspace-select-namespace', {
      ns: getActiveTab(getState())?.namespace,
    });
  };
};

export const selectNextTab = (): CollectionTabsThunkAction<void> => {
  return (dispatch, getState, { globalAppRegistry }) => {
    dispatch({ type: CollectionTabsActions.SelectNextTab });
    globalAppRegistry.emit('collection-workspace-select-namespace', {
      ns: getActiveTab(getState())?.namespace,
    });
  };
};

export const moveTabByIndex = (
  fromIndex: number,
  toIndex: number
): CollectionTabsThunkAction<void> => {
  return (dispatch, getState, { globalAppRegistry }) => {
    dispatch({ type: CollectionTabsActions.MoveTab, fromIndex, toIndex });
    globalAppRegistry.emit('collection-workspace-select-namespace', {
      ns: getActiveTab(getState())?.namespace,
    });
  };
};

export const closeTabAtIndex = (
  index: number
): CollectionTabsThunkAction<void> => {
  return (dispatch, getState, { globalAppRegistry }) => {
    const lastActiveTab = getActiveTab(getState());
    dispatch({ type: CollectionTabsActions.CloseTab, index });
    if (lastActiveTab && getState().tabs.length === 0) {
      const { database } = toNs(lastActiveTab.namespace);
      globalAppRegistry.emit('select-database', database);
    }
  };
};

export const getActiveTabIndex = (state: CollectionTabsState) => {
  const { activeTabId, tabs } = state;
  return tabs.findIndex((tab) => tab.id === activeTabId);
};

export const getActiveTab = (
  state: CollectionTabsState
): CollectionTab | null => {
  return state.tabs[getActiveTabIndex(state)] ?? null;
};

export const openNewTabForCurrentCollection =
  (): CollectionTabsThunkAction<void> => {
    return (dispatch, getState, { globalAppRegistry }) => {
      const activeTab = getActiveTab(getState());
      // Create new tab always uses the current active tab namespace, without
      // active tab, we can't create new tab
      if (!activeTab) {
        throw new Error("Can't create new tab when no tabs are on the screen");
      }
      // TODO(COMPASS-7020): we can remove this indirection when moving the
      // logic to compass-workspace plugin and make sure that compass-collection
      // tab is responsible for getting all required metadata
      globalAppRegistry.emit(
        'collection-workspace-open-collection-in-new-tab',
        { ns: activeTab.namespace }
      );
    };
  };

export const collectionDropped = (
  namespace: string
): CollectionTabsThunkAction<void> => {
  return (dispath, getState, { globalAppRegistry }) => {
    const lastActiveTab = getActiveTab(getState());
    dispath({ type: CollectionTabsActions.CollectionDropped, namespace });
    // We just removed last tab, emit event and let instance store figure out
    // what to open based on that
    if (lastActiveTab && getState().tabs.length === 0) {
      globalAppRegistry.emit(
        'active-collection-dropped',
        lastActiveTab.namespace
      );
    }
  };
};

export const databaseDropped = (
  namespace: string
): CollectionTabsThunkAction<void> => {
  return (dispath, getState, { globalAppRegistry }) => {
    const lastActiveTab = getActiveTab(getState());
    dispath({ type: CollectionTabsActions.DatabaseDropped, namespace });
    if (lastActiveTab && getState().tabs.length === 0) {
      const { database } = toNs(lastActiveTab.namespace);
      globalAppRegistry.emit('active-database-dropped', database);
    }
  };
};

export const dataServiceConnected = () => {
  return { type: CollectionTabsActions.DataServiceConnected };
};

export const dataServiceDisconnected = () => {
  // TODO: get localAppRegistry for existing tabs and clean up
  return { type: CollectionTabsActions.DataServiceDisconnected };
};

export default reducer;
