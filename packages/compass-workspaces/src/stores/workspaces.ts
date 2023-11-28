import type { Reducer, AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import { ObjectId } from 'bson';
import AppRegistry from 'hadron-app-registry';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import toNS from 'mongodb-ns';
import type { WorkspacesServices } from '..';

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
  CollectionRemoved = 'compass-workspaces/CollectionRemoved',
  DatabaseRemoved = 'compass-workspaces/DatabaseRemoved',
}

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

export type Workspace =
  | { type: 'My Queries' }
  | { type: 'Databases' }
  | { type: 'Performance' }
  | { type: 'Collections'; namespace: string }
  | {
      type: 'Collection';
      namespace: string;
      collectionType: 'collection' | 'view' | 'timeseries' | null;
      activeSubTab:
        | 'Documents'
        | 'Aggregations'
        | 'Schema'
        | 'Indexes'
        | 'Validation'
        | null;
      initialQuery?: unknown;
      initialAggregation?: unknown;
      initialPipelineText?: string;
      editingViewNamespace?: string;

      // TODO: make collection-tab plugin resolve metadata on its own
      metadata: CollectionTabPluginMetadata;
    };

export type WorkspaceByType<T extends Workspace['type']> = Extract<
  Workspace,
  { type: T }
>;

export type WorkspaceTab = { id: string } & Workspace;

export type WorkspacesState = {
  tabs: WorkspaceTab[];
  activeTabId: string | null;
};

const getTabId = () => {
  return new ObjectId().toString();
};

export const getInitialTabState = (
  workspace: OpenWorkspaceOptions
): WorkspaceTab => {
  const tabId = getTabId();
  switch (workspace.type) {
    case 'Databases':
    case 'My Queries':
    case 'Performance':
      return {
        id: tabId,
        type: workspace.type,
      };
    case 'Collections':
      return {
        id: tabId,
        type: workspace.type,
        namespace: workspace.namespace,
      };
    case 'Collection': {
      const activeSubTab =
        workspace.initialAggregation || workspace.initialPipelineText
          ? 'Aggregations'
          : workspace.initialQuery
          ? 'Documents'
          : workspace.activeSubTab ?? 'Documents';

      // TODO: make collection-tab plugin resolve metadata on its own
      const collectionType = workspace.metadata.isTimeSeries
        ? 'timeseries'
        : workspace.metadata.isReadonly
        ? 'view'
        : 'collection';

      return {
        id: tabId,
        type: workspace.type,
        namespace: workspace.namespace,
        collectionType,
        activeSubTab,
        initialQuery: workspace.initialQuery,
        initialAggregation: workspace.initialAggregation,
        initialPipelineText: workspace.initialPipelineText,
        editingViewNamespace: workspace.editingViewNamespace,

        // TODO: make collection-tab plugin resolve metadata on its own
        metadata: workspace.metadata,
      };
    }
  }
};

const getInitialState = () => {
  return {
    tabs: [] as WorkspaceTab[],
    activeTabId: null,
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
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    }

    if (
      action.workspace.type === 'My Queries' ||
      action.workspace.type === 'Databases' ||
      action.workspace.type === 'Performance'
    ) {
      const existingTab = state.tabs.find(
        (tab) => tab.type === action.workspace.type
      );
      if (existingTab) {
        if (existingTab.id === state.activeTabId) {
          return state;
        }
        return {
          ...state,
          activeTabId: existingTab.id,
        };
      } else {
        const tab = getInitialTabState(action.workspace);
        return {
          tabs: [...state.tabs, tab],
          activeTabId: tab.id,
        };
      }
    }

    if (
      action.workspace.type === 'Collections' ||
      action.workspace.type === 'Collection'
    ) {
      const { namespace, type } = action.workspace;
      const existingTab = state.tabs.find((tab) => {
        return tab.type === type && tab.namespace === namespace;
      });
      if (existingTab) {
        if (existingTab.id !== state.activeTabId) {
          return {
            ...state,
            activeTabId: existingTab.id,
          };
        }
        return state;
      }
      const activeTab = getActiveTab(state);
      const newTab = getInitialTabState(action.workspace);
      if (activeTab?.type !== action.workspace.type) {
        return {
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        };
      }
      const activeTabIndex = getActiveTabIndex(state);
      const newTabs = [...state.tabs];
      newTabs.splice(activeTabIndex, 1, newTab);
      return {
        tabs: newTabs,
        activeTabId: newTab.id,
      };
    }
  }

  if (isAction<SelectTabAction>(action, WorkspacesActions.SelectTab)) {
    return {
      ...state,
      activeTabId: state.tabs[action.atIndex].id,
    };
  }

  if (isAction<SelectNextTabAction>(action, WorkspacesActions.SelectNextTab)) {
    const newActiveTabIndex =
      (getActiveTabIndex(state) + 1) % state.tabs.length;
    const newActiveTab = state.tabs[newActiveTabIndex];
    return {
      ...state,
      activeTabId: newActiveTab.id ?? state.activeTabId,
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
    return {
      ...state,
      activeTabId: newActiveTab.id ?? state.activeTabId,
    };
  }

  if (isAction<MoveTabAction>(action, WorkspacesActions.MoveTab)) {
    const newTabs = [...state.tabs];
    newTabs.splice(action.toIndex, 0, newTabs.splice(action.fromIndex, 1)[0]);
    return {
      ...state,
      tabs: newTabs,
    };
  }

  if (isAction<CloseTabAction>(action, WorkspacesActions.CloseTab)) {
    const tabToClose = state.tabs[action.atIndex];
    const tabIndex = state.tabs.findIndex((tab) => tab.id === tabToClose.id);
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
      tabs,
      activeTabId: activeTabRemoved
        ? tabs[tabs.length - 1].id
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
      tabs,
      activeTabId: activeTabRemoved
        ? tabs[tabs.length - 1].id
        : state.activeTabId,
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
  | Pick<WorkspaceByType<'My Queries'>, 'type'>
  | Pick<WorkspaceByType<'Databases'>, 'type'>
  | Pick<WorkspaceByType<'Performance'>, 'type'>
  | Pick<WorkspaceByType<'Collections'>, 'type' | 'namespace'>
  | (Pick<
      WorkspaceByType<'Collection'>,
      | 'type'
      | 'namespace'

      // TODO: make collection-tab plugin resolve metadata on its own
      | 'metadata'
    > &
      Partial<
        Pick<
          WorkspaceByType<'Collection'>,
          | 'activeSubTab'
          | 'initialQuery'
          | 'initialAggregation'
          | 'initialPipelineText'
          | 'editingViewNamespace'
        >
      >);

type OpenWorkspaceAction = {
  type: WorkspacesActions.OpenWorkspace;
  workspace: OpenWorkspaceOptions;
  newTab?: boolean;
};

export const openWorkspace = (
  workspaceOptions: OpenWorkspaceOptions,
  tabOptions?: { newTab?: boolean }
): OpenWorkspaceAction => {
  return {
    type: WorkspacesActions.OpenWorkspace,
    workspace: workspaceOptions,
    newTab: !!tabOptions?.newTab,
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
): ThunkAction<void, WorkspacesState, void, CloseTabAction> => {
  return (dispatch, getState) => {
    const tab = getState().tabs[atIndex];
    dispatch({ type: WorkspacesActions.CloseTab, atIndex });
    cleanupLocalAppRegistryForTab(tab?.id);
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

// TODO: events are re-emitted when tab is changed for compatibility reasons,
// this will go away as soon as we finish the compass-workspaces refactor.
// Emitting these event will trigger store actions for opening a tab, but they
// will be no-ops, will not result in any state update
export const emitOnTabChange = (
  activeTab: WorkspaceTab
): WorkspacesThunkAction<void> => {
  return (dispatch, getState, { globalAppRegistry }) => {
    switch (activeTab.type) {
      case 'My Queries':
      case 'Databases':
      case 'Performance':
        globalAppRegistry.emit('open-instance-workspace', activeTab.type);
        return;
      case 'Collections':
        globalAppRegistry.emit('select-database', activeTab.namespace);
        return;
      case 'Collection':
        globalAppRegistry.emit('select-namespace', activeTab.metadata);
        return;
    }
  };
};

export default reducer;
