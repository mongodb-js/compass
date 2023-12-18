import type { Reducer, AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import { ObjectId } from 'bson';
import AppRegistry from 'hadron-app-registry';
import toNS from 'mongodb-ns';
import type { AnyWorkspace, Workspace, WorkspacesServices } from '..';
import { isEqual } from 'lodash';

const LocalAppRegistryMap = new Map<string, AppRegistry>();

type WorkspacesThunkAction<R, A extends AnyAction = AnyAction> = ThunkAction<
  R,
  WorkspacesState,
  WorkspacesServices,
  A
>;

export const getLocalAppRegistryForTab = (tabId: string) => {
  let appRegistry = LocalAppRegistryMap.get(tabId);
  if (appRegistry) {
    return appRegistry;
  }
  appRegistry = new AppRegistry();
  LocalAppRegistryMap.set(tabId, appRegistry);
  return appRegistry;
};

const cleanupLocalAppRegistryForTab = (tabId: string): boolean => {
  const appRegistry = LocalAppRegistryMap.get(tabId);
  appRegistry?.deactivate();
  return LocalAppRegistryMap.delete(tabId);
};

export enum WorkspacesActions {
  OpenWorkspace = 'compass-workspaces/OpenWorkspace',
  SelectTab = 'compass-workspaces/SelectTab',
  SelectPreviousTab = 'compass-workspaces/SelectPreviousTab',
  SelectNextTab = 'compass-workspaces/SelectNextTab',
  MoveTab = 'compass-workspaces/MoveTab',
  OpenTabFromCurrentActive = 'compass-workspaces/OpenTabFromCurrentActive',
  CloseTab = 'compass-workspaces/CloseTab',
  CollectionRenamed = 'compass-workspaces/CollectionRenamed',
  CollectionRemoved = 'compass-workspaces/CollectionRemoved',
  DatabaseRemoved = 'compass-workspaces/DatabaseRemoved',
  FetchCollectionTabInfo = 'compass-workspaces/FetchCollectionTabInfo',
}

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

export type WorkspaceTab = { id: string } & AnyWorkspace;

export type CollectionTabInfo = {
  isTimeSeries: boolean;
  isReadonly: boolean;
  sourceName?: string | null;
};

export type WorkspacesState = {
  /**
   * All currently open tabs
   */
  tabs: WorkspaceTab[];
  /**
   * Currrent active tab id
   */
  activeTabId: string | null;
  /**
   * Extra info for the collection tab namespace (required for breadcrumb and
   * icon)
   */
  collectionInfo: Record<string, CollectionTabInfo>;
};

const getTabId = () => {
  return new ObjectId().toString();
};

export const getInitialTabState = (
  workspace: OpenWorkspaceOptions
): WorkspaceTab => {
  const tabId = getTabId();
  return { id: tabId, ...workspace } as WorkspaceTab;
};

const getInitialState = () => {
  return {
    tabs: [] as WorkspaceTab[],
    activeTabId: null,
    collectionInfo: {},
  };
};

const reducer: Reducer<WorkspacesState> = (
  state = getInitialState(),
  action
) => {
  if (isAction<OpenWorkspaceAction>(action, WorkspacesActions.OpenWorkspace)) {
    if (action.newTab) {
      const newTab = getInitialTabState(action.workspace);
      return {
        ...state,
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    }
    const activeTab = getActiveTab(state);
    const existingTab =
      // If there is an active tab, give it priority when looking for a tab to
      // select when opening a tab, it might be that we don't need to update the
      // state at all
      (activeTab ? [activeTab, ...state.tabs] : state.tabs).find(
        ({
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          id: _id,
          ...tab
        }) => {
          return isEqual(tab, action.workspace);
        }
      );
    if (existingTab) {
      if (existingTab.id !== state.activeTabId) {
        return {
          ...state,
          activeTabId: existingTab.id,
        };
      }
      return state;
    }
    // If there is no existing tab matching the one we're trying to open, either
    // replace the current tab if we're trying to open the same workspace that
    // is currently active, or just open a new tab with the workspace
    const newTab = getInitialTabState(action.workspace);
    if (activeTab?.type !== action.workspace.type) {
      return {
        ...state,
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    }
    const activeTabIndex = getActiveTabIndex(state);
    const newTabs = [...state.tabs];
    newTabs.splice(activeTabIndex, 1, newTab);
    return {
      ...state,
      tabs: newTabs,
      activeTabId: newTab.id,
    };
  }

  if (
    isAction<OpenTabFromCurrentActiveAction>(
      action,
      WorkspacesActions.OpenTabFromCurrentActive
    )
  ) {
    const currentActiveTab = getActiveTab(state);
    let newTab: WorkspaceTab;
    if (!currentActiveTab) {
      newTab = getInitialTabState({ type: 'My Queries' });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...tabProps } = currentActiveTab;
      newTab = getInitialTabState(tabProps);
    }
    return {
      ...state,
      tabs: [...state.tabs, newTab],
      activeTabId: newTab.id,
    };
  }

  if (isAction<SelectTabAction>(action, WorkspacesActions.SelectTab)) {
    if (state.tabs[action.atIndex]?.id === state.activeTabId) {
      return state;
    }
    return {
      ...state,
      activeTabId: state.tabs[action.atIndex]?.id ?? null,
    };
  }

  if (isAction<SelectNextTabAction>(action, WorkspacesActions.SelectNextTab)) {
    const newActiveTabIndex =
      (getActiveTabIndex(state) + 1) % state.tabs.length;
    const newActiveTab = state.tabs[newActiveTabIndex];
    if (newActiveTab?.id === state.activeTabId) {
      return state;
    }
    return {
      ...state,
      activeTabId: newActiveTab?.id ?? state.activeTabId,
    };
  }

  if (
    isAction<SelectPreviousTabAction>(
      action,
      WorkspacesActions.SelectPreviousTab
    )
  ) {
    const currentActiveTabIndex = getActiveTabIndex(state);
    const newActiveTabIndex =
      getActiveTabIndex(state) === 0
        ? state.tabs.length - 1
        : currentActiveTabIndex - 1;
    const newActiveTab = state.tabs[newActiveTabIndex];
    if (newActiveTab?.id === state.activeTabId) {
      return state;
    }
    return {
      ...state,
      activeTabId: newActiveTab?.id ?? state.activeTabId,
    };
  }

  if (isAction<MoveTabAction>(action, WorkspacesActions.MoveTab)) {
    if (action.fromIndex === action.toIndex) {
      return state;
    }
    const newTabs = [...state.tabs];
    newTabs.splice(action.toIndex, 0, newTabs.splice(action.fromIndex, 1)[0]);
    return {
      ...state,
      tabs: newTabs,
    };
  }

  if (isAction<CloseTabAction>(action, WorkspacesActions.CloseTab)) {
    const tabToClose = state.tabs[action.atIndex];
    const tabIndex = state.tabs.findIndex((tab) => tab.id === tabToClose?.id);
    const newTabs = [...state.tabs];
    newTabs.splice(action.atIndex, 1);
    const newActiveTabId =
      tabToClose.id === state.activeTabId
        ? // We follow standard browser behavior with tabs on how we handle
          // which tab gets activated if we close the active tab. If the active
          // tab is the last tab, we activate the one before it, otherwise we
          // activate the next tab.
          (state.tabs[tabIndex + 1] ?? newTabs[newTabs.length - 1])?.id ?? null
        : state.activeTabId;
    return {
      ...state,
      activeTabId: newActiveTabId,
      tabs: newTabs,
    };
  }

  if (
    isAction<CollectionRemovedAction>(
      action,
      WorkspacesActions.CollectionRemoved
    )
  ) {
    const tabs = state.tabs.filter((tab) => {
      switch (tab.type) {
        case 'Collection':
          return tab.namespace !== action.namespace;
        default:
          return true;
      }
    });
    if (tabs.length === state.tabs.length) {
      return state;
    }
    const activeTabRemoved = !tabs.some((tab) => {
      return tab.id === state.activeTabId;
    });
    return {
      ...state,
      tabs,
      activeTabId: activeTabRemoved
        ? tabs[tabs.length - 1]?.id ?? null
        : state.activeTabId,
    };
  }

  if (
    isAction<DatabaseRemovedAction>(action, WorkspacesActions.DatabaseRemoved)
  ) {
    const tabs = state.tabs.filter((tab) => {
      switch (tab.type) {
        case 'Collections':
          return tab.namespace !== action.namespace;
        case 'Collection':
          return toNS(tab.namespace).database !== action.namespace;
        default:
          return true;
      }
    });
    if (tabs.length === state.tabs.length) {
      return state;
    }
    const activeTabRemoved = !tabs.some((tab) => {
      return tab.id === state.activeTabId;
    });
    return {
      ...state,
      tabs,
      activeTabId: activeTabRemoved
        ? tabs[tabs.length - 1]?.id ?? null
        : state.activeTabId,
    };
  }

  if (
    isAction<CollectionRenamedAction>(
      action,
      WorkspacesActions.CollectionRenamed
    )
  ) {
    let tabsRenamed = 0;
    let newActiveTabId = state.activeTabId;
    const newTabs = state.tabs.map((tab) => {
      if (tab.type === 'Collection' && tab.namespace === action.from) {
        tabsRenamed++;
        const { id, ...workspace } = tab;
        const newTab = getInitialTabState({
          ...workspace,
          namespace: action.to,
        });
        if (id === state.activeTabId) {
          newActiveTabId = newTab.id;
        }
        return newTab;
      }
      return tab;
    });
    if (tabsRenamed === 0) {
      return state;
    }
    return {
      ...state,
      tabs: newTabs,
      activeTabId: newActiveTabId,
    };
  }

  if (
    isAction<FetchCollectionInfoAction>(
      action,
      WorkspacesActions.FetchCollectionTabInfo
    )
  ) {
    return {
      ...state,
      collectionInfo: {
        ...state.collectionInfo,
        [action.namespace]: action.info,
      },
    };
  }

  return state;
};

export const getActiveTabIndex = (state: WorkspacesState) => {
  const { activeTabId, tabs } = state;
  return tabs.findIndex((tab) => tab.id === activeTabId);
};

export const getActiveTab = (state: WorkspacesState): WorkspaceTab | null => {
  return state.tabs[getActiveTabIndex(state)] ?? null;
};

export type OpenWorkspaceOptions =
  | Pick<Workspace<'My Queries'>, 'type'>
  | Pick<Workspace<'Databases'>, 'type'>
  | Pick<Workspace<'Performance'>, 'type'>
  | Pick<Workspace<'Collections'>, 'type' | 'namespace'>
  | (Pick<Workspace<'Collection'>, 'type' | 'namespace'> &
      Partial<
        Pick<
          Workspace<'Collection'>,
          | 'initialQuery'
          | 'initialAggregation'
          | 'initialPipeline'
          | 'initialPipelineText'
          | 'editViewName'
        >
      >);

type OpenWorkspaceAction = {
  type: WorkspacesActions.OpenWorkspace;
  workspace: OpenWorkspaceOptions;
  newTab?: boolean;
};

type FetchCollectionInfoAction = {
  type: WorkspacesActions.FetchCollectionTabInfo;
  namespace: string;
  info: CollectionTabInfo;
};

export type TabOptions = { newTab?: boolean };

export const openWorkspace = (
  workspaceOptions: OpenWorkspaceOptions,
  tabOptions?: TabOptions
): WorkspacesThunkAction<
  void,
  OpenWorkspaceAction | FetchCollectionInfoAction
> => {
  return (dispatch, getState, { instance, dataService }) => {
    if (
      workspaceOptions.type === 'Collection' &&
      !getState().collectionInfo[workspaceOptions.namespace]
    ) {
      // Fetching extra meta for collection should not block tab opening
      void (async () => {
        const { database, collection } = toNS(workspaceOptions.namespace);
        try {
          const coll = await instance.getNamespace({
            dataService,
            database,
            collection,
          });
          if (coll) {
            await coll.fetch({ dataService });
            dispatch({
              type: WorkspacesActions.FetchCollectionTabInfo,
              namespace: workspaceOptions.namespace,
              info: {
                isTimeSeries: coll.isTimeSeries,
                isReadonly: coll.readonly ?? coll.isView,
                sourceName: coll.sourceName,
              },
            });
          }
        } catch (err) {
          // It's okay if we failed to fetch this optional metadata, this error
          // can be ignored
          if ((err as Error).name === 'MongoServerError') {
            return;
          }
          throw err;
        }
      })();
    }
    dispatch({
      type: WorkspacesActions.OpenWorkspace,
      workspace: workspaceOptions,
      newTab: !!tabOptions?.newTab,
    });
  };
};

type SelectTabAction = { type: WorkspacesActions.SelectTab; atIndex: number };

export const selectTab = (atIndex: number): SelectTabAction => {
  return { type: WorkspacesActions.SelectTab, atIndex };
};

type MoveTabAction = {
  type: WorkspacesActions.MoveTab;
  fromIndex: number;
  toIndex: number;
};

export const moveTab = (fromIndex: number, toIndex: number): MoveTabAction => {
  return { type: WorkspacesActions.MoveTab, fromIndex, toIndex };
};

type SelectPreviousTabAction = { type: WorkspacesActions.SelectPreviousTab };

export const selectPrevTab = (): SelectPreviousTabAction => {
  return { type: WorkspacesActions.SelectPreviousTab };
};

type SelectNextTabAction = { type: WorkspacesActions.SelectNextTab };

export const selectNextTab = (): SelectNextTabAction => {
  return { type: WorkspacesActions.SelectNextTab };
};

type OpenTabFromCurrentActiveAction = {
  type: WorkspacesActions.OpenTabFromCurrentActive;
};

export const openTabFromCurrent = (): OpenTabFromCurrentActiveAction => {
  return { type: WorkspacesActions.OpenTabFromCurrentActive };
};

type CloseTabAction = { type: WorkspacesActions.CloseTab; atIndex: number };

export const closeTab = (
  atIndex: number
): WorkspacesThunkAction<void, CloseTabAction> => {
  return (dispatch, getState) => {
    const tab = getState().tabs[atIndex];
    dispatch({ type: WorkspacesActions.CloseTab, atIndex });
    cleanupLocalAppRegistryForTab(tab?.id);
  };
};

type CollectionRenamedAction = {
  type: WorkspacesActions.CollectionRenamed;
  from: string;
  to: string;
};

export const collectionRenamed = (
  from: string,
  to: string
): WorkspacesThunkAction<void, CollectionRenamedAction> => {
  return (dispatch, getState) => {
    const tabsToReplace = getState().tabs.filter(
      (tab) => tab.type === 'Collection' && tab.namespace === from
    );
    dispatch({ type: WorkspacesActions.CollectionRenamed, from, to });
    tabsToReplace.forEach((tab) => {
      cleanupLocalAppRegistryForTab(tab.id);
    });
  };
};

type CollectionRemovedAction = {
  type: WorkspacesActions.CollectionRemoved;
  namespace: string;
};

export const collectionRemoved = (
  namespace: string
): WorkspacesThunkAction<void, CollectionRemovedAction> => {
  return (dispatch, getState) => {
    const tabsToRemove = getState().tabs.filter(
      (tab) => tab.type === 'Collection' && tab.namespace === namespace
    );
    dispatch({
      type: WorkspacesActions.CollectionRemoved,
      namespace,
    });
    tabsToRemove.forEach((tab) => {
      cleanupLocalAppRegistryForTab(tab.id);
    });
  };
};

type DatabaseRemovedAction = {
  type: WorkspacesActions.DatabaseRemoved;
  namespace: string;
};

export const databaseRemoved = (
  namespace: string
): WorkspacesThunkAction<void, DatabaseRemovedAction> => {
  return (dispatch, getState) => {
    const tabsToRemove = getState().tabs.filter((tab) => {
      switch (tab.type) {
        case 'Collections':
          return tab.namespace === namespace;
        case 'Collection':
          return toNS(tab.namespace).database === namespace;
        default:
          return false;
      }
    });
    dispatch({
      type: WorkspacesActions.DatabaseRemoved,
      namespace,
    });
    tabsToRemove.forEach((tab) => {
      cleanupLocalAppRegistryForTab(tab.id);
    });
  };
};

export default reducer;
