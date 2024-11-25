import type { Reducer, AnyAction, Action } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import { ObjectId } from 'bson';
import AppRegistry from 'hadron-app-registry';
import toNS from 'mongodb-ns';
import type {
  CollectionWorkspace,
  CollectionsWorkspace,
  DatabasesWorkspace,
  MyQueriesWorkspace,
  ShellWorkspace,
  ServerStatsWorkspace,
  WelcomeWorkspace,
  Workspace,
  WorkspacesServices,
  CollectionSubtab,
} from '..';
import { isEqual } from 'lodash';
import { cleanupTabState } from '../components/workspace-tab-state-provider';
import {
  cleanupTabDestroyHandler,
  canCloseTab,
  canReplaceTab,
} from '../components/workspace-close-handler';
import { type ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { showConfirmation } from '@mongodb-js/compass-components';

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

export const cleanupLocalAppRegistries = () => {
  for (const appRegistry of LocalAppRegistryMap.values()) {
    appRegistry.deactivate();
  }
  LocalAppRegistryMap.clear();
};

export enum WorkspacesActions {
  OpenWorkspace = 'compass-workspaces/OpenWorkspace',
  OpenFallbackWorkspace = 'compass-workspace/OpenFallbackWorkspace',
  SelectTab = 'compass-workspaces/SelectTab',
  SelectPreviousTab = 'compass-workspaces/SelectPreviousTab',
  SelectNextTab = 'compass-workspaces/SelectNextTab',
  MoveTab = 'compass-workspaces/MoveTab',
  OpenTabFromCurrentActive = 'compass-workspaces/OpenTabFromCurrentActive',
  CloseTab = 'compass-workspaces/CloseTab',
  CollectionRenamed = 'compass-workspaces/CollectionRenamed',
  CollectionRemoved = 'compass-workspaces/CollectionRemoved',
  DatabaseRemoved = 'compass-workspaces/DatabaseRemoved',
  ConnectionDisconnected = 'compass-workspaces/ConnectionDisconnected',
  FetchCollectionTabInfo = 'compass-workspaces/FetchCollectionTabInfo',
  CollectionSubtabSelected = 'compass-workspaces/CollectionSubtabSelected',
}

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

type WorkspaceTabProps =
  | Omit<WelcomeWorkspace, 'tabId'>
  | Omit<MyQueriesWorkspace, 'tabId'>
  | Omit<ShellWorkspace, 'tabId'>
  | Omit<ServerStatsWorkspace, 'tabId'>
  | Omit<DatabasesWorkspace, 'tabId'>
  | Omit<CollectionsWorkspace, 'tabId'>
  | (Omit<CollectionWorkspace, 'onSelectSubtab' | 'initialSubtab' | 'tabId'> & {
      subTab: CollectionSubtab;
    });

export type WorkspaceTab = {
  id: string;
} & WorkspaceTabProps;

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

const filterTabs = ({
  tabs,
  isToBeClosed,
}: {
  tabs: WorkspaceTab[];
  isToBeClosed: (tab: WorkspaceTab, index: number) => boolean;
}): {
  newTabs: WorkspaceTab[];
  removedIndexes: number[];
} => {
  const newTabs: WorkspaceTab[] = [];
  const removedIndexes: number[] = [];
  tabs.forEach((tab, index) => {
    if (isToBeClosed(tab, index)) {
      removedIndexes.push(index);
    } else {
      newTabs.push(tab);
    }
  });
  return { newTabs, removedIndexes };
};

const getNewActiveTabId = ({
  state,
  newTabs,
  removedIndexes,
}: {
  state: WorkspacesState;
  newTabs: WorkspaceTab[];
  removedIndexes: number[];
}) => {
  // We follow standard browser behavior with tabs on how we handle
  // which tab gets activated if we close the active tab. We
  // activate the next tab that isn't being closed. If there is no next tab, we activate the last one.
  let newActiveTabId = state.activeTabId;
  let activeTabIndex = getActiveTabIndex(state);
  while (removedIndexes.includes(activeTabIndex)) {
    activeTabIndex++;
  }
  if (!newTabs.length) {
    // no tabs left open
    newActiveTabId = null;
  } else if (activeTabIndex >= state.tabs.length) {
    // the active tab and everything after it was closed
    newActiveTabId = newTabs[newTabs.length - 1]?.id;
  } else {
    newActiveTabId = state.tabs[activeTabIndex]?.id;
  }
  return newActiveTabId;
};

/**
 * only exported for tests
 */
export const _bulkTabsClose = ({
  state,
  isToBeClosed,
}: {
  state: WorkspacesState;
  isToBeClosed: (tab: WorkspaceTab, index: number) => boolean;
}) => {
  const { newTabs, removedIndexes } = filterTabs({
    tabs: state.tabs,
    isToBeClosed,
  });

  if (newTabs.length === state.tabs.length) {
    return state;
  }

  const newActiveTabId = getNewActiveTabId({
    state,
    removedIndexes,
    newTabs,
  });

  return {
    ...state,
    activeTabId: newActiveTabId,
    tabs: newTabs,
  };
};

export const getInitialTabState = (
  workspace: OpenWorkspaceOptions
): WorkspaceTab => {
  const tabId = getTabId();
  if (workspace.type === 'Collection') {
    const { initialSubtab, ...rest } = workspace;

    const isAggregationsSubtab = Boolean(
      rest.initialAggregation ||
        rest.initialPipeline ||
        rest.initialPipelineText ||
        rest.editViewName
    );

    const subTab =
      initialSubtab ?? (isAggregationsSubtab ? 'Aggregations' : 'Documents');

    return {
      id: tabId,
      subTab,
      ...rest,
    };
  }
  return { id: tabId, ...workspace };
};

const getInitialState = () => {
  return {
    tabs: [] as WorkspaceTab[],
    activeTabId: null,
    collectionInfo: {},
  };
};

/**
 * Compares two workspaces, ignoring their ids and subtabs (in case of
 * Collection workspace)
 */
const isWorkspaceEqual = (
  t1: WorkspaceTabProps & Partial<{ id: string; subTab: string }>,
  t2: WorkspaceTabProps & Partial<{ id: string; subTab: string }>
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id1, subTab: _st1, ...ws1 } = t1;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id2, subTab: _st2, ...ws2 } = t2;
  return isEqual(ws1, ws2);
};

const getRemovedTabsIndexes = (
  oldTabs: WorkspaceTab[],
  newTabs: WorkspaceTab[]
) => {
  const newTabsIds = new Set(
    newTabs.map((tab) => {
      return tab.id;
    })
  );
  return new Set(
    oldTabs
      .map((tab) => {
        return tab.id;
      })
      .filter((id) => {
        return !newTabsIds.has(id);
      })
  );
};

const cleanupRemovedTabs = (
  oldTabs: WorkspaceTab[],
  newTabs: WorkspaceTab[]
) => {
  for (const tabId of getRemovedTabsIndexes(oldTabs, newTabs)) {
    cleanupLocalAppRegistryForTab(tabId);
    cleanupTabState(tabId);
    cleanupTabDestroyHandler('close', tabId);
    cleanupTabDestroyHandler('replace', tabId);
  }
};

const reducer: Reducer<WorkspacesState, Action> = (
  state = getInitialState(),
  action
) => {
  if (isAction<OpenWorkspaceAction>(action, WorkspacesActions.OpenWorkspace)) {
    const currentActiveTab = getActiveTab(state);
    const newTab = getInitialTabState(action.workspace);
    let forceNewTab = false;

    // If we are not requesting for the workspace to be opened in the new tab ...
    if (!action.newTab) {
      const existingWorkspace =
        // If there is an active tab, give it priority when looking for a tab to
        // select when opening a tab, it might be that we don't need to update
        // the state at all
        (
          currentActiveTab ? [currentActiveTab, ...state.tabs] : state.tabs
        ).find((tab) => {
          return isWorkspaceEqual(tab, newTab);
        });

      // ... first check if similar workspace already exists, and if it does,
      // just switch the current active tab
      if (existingWorkspace) {
        return existingWorkspace.id !== state.activeTabId
          ? {
              ...state,
              activeTabId: existingWorkspace.id,
            }
          : state;
      }

      if (currentActiveTab) {
        // if both the new workspace and the existing one are connection scoped,
        // make sure we do not replace tabs between different connections
        if (
          action.workspace.type !== 'Welcome' &&
          action.workspace.type !== 'My Queries' &&
          currentActiveTab.type !== 'Welcome' &&
          currentActiveTab.type !== 'My Queries'
        ) {
          forceNewTab =
            action.workspace.connectionId !== currentActiveTab.connectionId;
        }

        // ... check if we can replace the current tab based on its
        // replace handlers and force new tab opening if we can't
        if (!forceNewTab)
          forceNewTab = canReplaceTab(currentActiveTab) === false;
      }
    }

    if (forceNewTab || action.newTab) {
      // Always insert new tab after the active one
      const activeTabIndex = getActiveTabIndex(state);
      const newTabs = [...state.tabs];
      newTabs.splice(activeTabIndex + 1, 0, newTab);
      return {
        ...state,
        tabs: newTabs,
        activeTabId: newTab.id,
      };
    }

    const toReplaceIndex = getActiveTabIndex(state);
    const newTabs = [...state.tabs];
    newTabs.splice(toReplaceIndex, 1, newTab);
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
      newTab = getInitialTabState(action.defaultTab);
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

  if (
    isAction<OpenFallbackWorkspaceAction>(
      action,
      WorkspacesActions.OpenFallbackWorkspace
    )
  ) {
    const {
      collection,
      database,
      ns: namespace,
    } = toNS(action.fallbackNamespace ?? '');
    const fallbackWorkspaceOptions = {
      ...(collection
        ? { type: 'Collection' as const, namespace }
        : database
        ? { type: 'Collections' as const, namespace }
        : { type: 'Databases' as const }),
      connectionId: action.toReplace.connectionId,
    };
    const newTab = getInitialTabState(fallbackWorkspaceOptions);
    const toReplaceIndex = state.tabs.findIndex((tab) => {
      return tab.id === action.toReplace.id;
    });
    const newTabs = [...state.tabs];
    newTabs.splice(toReplaceIndex, 1, newTab);
    return {
      ...state,
      tabs: newTabs,
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
      currentActiveTabIndex === 0
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
    return _bulkTabsClose({
      state,
      isToBeClosed: (_tab, index) => {
        return index === action.atIndex;
      },
    });
  }

  if (
    isAction<CollectionRemovedAction>(
      action,
      WorkspacesActions.CollectionRemoved
    )
  ) {
    const isToBeClosed = (tab: WorkspaceTab) =>
      tab.type === 'Collection' && tab.namespace === action.namespace;

    return _bulkTabsClose({
      state,
      isToBeClosed,
    });
  }

  if (
    isAction<DatabaseRemovedAction>(action, WorkspacesActions.DatabaseRemoved)
  ) {
    const isToBeClosed = (tab: WorkspaceTab) =>
      (tab.type === 'Collections' && tab.namespace === action.namespace) ||
      (tab.type === 'Collection' &&
        toNS(tab.namespace).database === action.namespace);

    return _bulkTabsClose({
      state,
      isToBeClosed,
    });
  }

  if (
    isAction<ConnectionDisconnectedAction>(
      action,
      WorkspacesActions.ConnectionDisconnected
    )
  ) {
    const isToBeClosed = (tab: WorkspaceTab) =>
      tab.type !== 'My Queries' &&
      tab.type !== 'Welcome' &&
      tab.connectionId === action.connectionId;

    return _bulkTabsClose({
      state,
      isToBeClosed,
    });
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

  if (
    isAction<CollectionSubtabSelectedAction>(
      action,
      WorkspacesActions.CollectionSubtabSelected
    )
  ) {
    const tab = state.tabs.find((tab) => tab.id === action.tabId);
    if (!tab || (tab.type === 'Collection' && tab.subTab === action.subTab)) {
      return state;
    }
    return {
      ...state,
      tabs: state.tabs.map((tab) => {
        if (tab.id === action.tabId) {
          return {
            ...tab,
            subTab: action.subTab,
          };
        }
        return tab;
      }),
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
  | Pick<Workspace<'Welcome'>, 'type'>
  | Pick<Workspace<'My Queries'>, 'type'>
  | Pick<
      Workspace<'Shell'>,
      'type' | 'connectionId' | 'initialEvaluate' | 'initialInput'
    >
  | Pick<Workspace<'Databases'>, 'type' | 'connectionId'>
  | Pick<Workspace<'Performance'>, 'type' | 'connectionId'>
  | Pick<Workspace<'Collections'>, 'type' | 'connectionId' | 'namespace'>
  | (Pick<Workspace<'Collection'>, 'type' | 'connectionId' | 'namespace'> &
      Partial<
        Pick<
          Workspace<'Collection'>,
          | 'initialQuery'
          | 'initialAggregation'
          | 'initialPipeline'
          | 'initialPipelineText'
          | 'editViewName'
        >
      > & { initialSubtab?: CollectionSubtab });

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

export type TabOptions = {
  /**
   * Optional. If set to `true`, always opens workspace in a new tab, otherwise
   * will resolve whether or not current active tab can be replaced based on the
   * replace handlers
   */
  newTab?: boolean;
};

const fetchCollectionInfo = (
  workspaceOptions: Extract<OpenWorkspaceOptions, { type: 'Collection' }>
): WorkspacesThunkAction<Promise<void>, FetchCollectionInfoAction> => {
  return async (
    dispatch,
    getState,
    { connections, instancesManager, logger }
  ) => {
    if (getState().collectionInfo[workspaceOptions.namespace]) {
      return;
    }

    const { database, collection } = toNS(workspaceOptions.namespace);

    try {
      const dataService = connections.getDataServiceForConnection(
        workspaceOptions.connectionId
      );

      const instance = instancesManager.getMongoDBInstanceForConnection(
        workspaceOptions.connectionId
      );

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
      logger.debug(
        'Collection Metadata',
        logger.mongoLogId(1_001_000_306),
        'Error fetching collection metadata for tab',
        { namespace: workspaceOptions.namespace },
        err
      );
    }
  };
};

export const openWorkspace = (
  workspaceOptions: OpenWorkspaceOptions,
  tabOptions?: TabOptions
): WorkspacesThunkAction<void, OpenWorkspaceAction> => {
  return (dispatch, getState) => {
    const oldTabs = getState().tabs;

    if (workspaceOptions.type === 'Collection') {
      // Fetching extra metadata for collection should not block tab opening
      void dispatch(fetchCollectionInfo(workspaceOptions));
    }

    dispatch({
      type: WorkspacesActions.OpenWorkspace,
      workspace: workspaceOptions,
      newTab: tabOptions?.newTab ?? false,
    });

    cleanupRemovedTabs(oldTabs, getState().tabs);
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
  defaultTab: OpenWorkspaceOptions;
};

export const openTabFromCurrent = (
  defaultTab?: OpenWorkspaceOptions | null
): OpenTabFromCurrentActiveAction => {
  return {
    type: WorkspacesActions.OpenTabFromCurrentActive,
    defaultTab: defaultTab ?? { type: 'My Queries' },
  };
};

type CloseTabAction = { type: WorkspacesActions.CloseTab; atIndex: number };

export const closeTab = (
  atIndex: number
): WorkspacesThunkAction<Promise<void>, CloseTabAction> => {
  return async (dispatch, getState) => {
    const tab = getState().tabs[atIndex];
    if (!canCloseTab(tab)) {
      const confirmClose = await showConfirmation({
        title: 'Are you sure you want to close the tab?',
        description:
          'The content of this tab has been modified. You will lose your changes if you close it.',
        buttonText: 'Close tab',
        variant: 'danger',
        'data-testid': 'confirm-tab-close',
      });
      if (!confirmClose) {
        return;
      }
    }
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
    const oldTabs = getState().tabs;
    dispatch({ type: WorkspacesActions.CollectionRenamed, from, to });
    cleanupRemovedTabs(oldTabs, getState().tabs);
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
    const oldTabs = getState().tabs;
    dispatch({
      type: WorkspacesActions.CollectionRemoved,
      namespace,
    });
    cleanupRemovedTabs(oldTabs, getState().tabs);
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
    const oldTabs = getState().tabs;
    dispatch({
      type: WorkspacesActions.DatabaseRemoved,
      namespace,
    });
    cleanupRemovedTabs(oldTabs, getState().tabs);
  };
};

type ConnectionDisconnectedAction = {
  type: WorkspacesActions.ConnectionDisconnected;
  connectionId: ConnectionInfo['id'];
};

export const connectionDisconnected = (
  connectionId: ConnectionInfo['id']
): WorkspacesThunkAction<void, ConnectionDisconnectedAction> => {
  return (dispatch, getState) => {
    const oldTabs = getState().tabs;
    dispatch({
      type: WorkspacesActions.ConnectionDisconnected,
      connectionId,
    });
    cleanupRemovedTabs(oldTabs, getState().tabs);
  };
};

type CollectionSubtabSelectedAction = {
  type: WorkspacesActions.CollectionSubtabSelected;
  tabId: string;
  subTab: CollectionSubtab;
};

export const collectionSubtabSelected = (
  tabId: string,
  subTab: CollectionSubtab
): CollectionSubtabSelectedAction => ({
  type: WorkspacesActions.CollectionSubtabSelected,
  tabId,
  subTab,
});

type OpenFallbackWorkspaceAction = {
  type: WorkspacesActions.OpenFallbackWorkspace;
  toReplace: Extract<WorkspaceTab, { namespace: string }>;
  fallbackNamespace: string | null;
};

export const openFallbackWorkspace = (
  tab: WorkspaceTab,
  fallbackNamespace?: string | null
): WorkspacesThunkAction<void, OpenFallbackWorkspaceAction> => {
  return (dispatch, getState) => {
    if (tab.type !== 'Collection' && tab.type !== 'Collections') {
      throw new Error(
        'Fallback workspace can only be opened for workspaces with a namespace'
      );
    }
    const oldTabs = getState().tabs;
    dispatch({
      type: WorkspacesActions.OpenFallbackWorkspace,
      toReplace: tab,
      fallbackNamespace: fallbackNamespace ?? null,
    });
    cleanupRemovedTabs(oldTabs, getState().tabs);
  };
};

export default reducer;
