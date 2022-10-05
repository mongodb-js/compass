import type { AnyAction, Dispatch } from 'redux';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import type AppRegistry from 'hadron-app-registry';
import type { Document } from 'mongodb';
import { ObjectId } from 'bson';
import toNS from 'mongodb-ns';

import createContext from '../stores/context';
import type { ContextProps } from '../stores/context';
import { appRegistryEmit } from './app-registry';
import type { RootState } from '../stores';

/**
 * The prefix.
 */
const PREFIX = 'collection';

/**
 * Namespace selected action name.
 */
export const SELECT_NAMESPACE = `${PREFIX}/tabs/SELECT_NAMESPACE`;

/**
 * Create tab action name.
 */
export const CREATE_TAB = `${PREFIX}/tabs/CREATE_TAB`;

/**
 * Close tab action name.
 */
export const CLOSE_TAB = `${PREFIX}/tabs/CLOSE_TAB`;

/**
 * Select tab action name.
 */
export const SELECT_TAB = `${PREFIX}/tabs/SELECT_TAB`;

/**
 * Move tab action name.
 */
export const MOVE_TAB = `${PREFIX}/tabs/MOVE_TAB`;

/**
 * Prev tab action name.
 */
export const PREV_TAB = `${PREFIX}/tabs/PREV_TAB`;

/**
 * Next tab action name.
 */
export const NEXT_TAB = `${PREFIX}/tabs/NEXT_TAB`;

/**
 * Change active subtab action name.
 */
export const CHANGE_ACTIVE_SUB_TAB = `${PREFIX}/tabs/CHANGE_ACTIVE_SUBTAB`;

/**
 * Clear tabs
 */
export const CLEAR_TABS = `${PREFIX}/tabs/CLEAR`;
export const COLLECTION_DROPPED = `${PREFIX}/tabs/COLLECTION_DROPPED`;
export const DATABASE_DROPPED = `${PREFIX}/tabs/DATABASE_DROPPED`;

export interface WorkspaceTabObject {
  id: string;
  namespace: string;
  isActive: boolean;
  activeSubTab: number;
  activeSubTabName: string;
  isReadonly: boolean;
  isTimeSeries: boolean;
  isClustered: boolean;
  isFLE: boolean;
  tabs: string[];
  views: JSX.Element[];
  subtab: WorkspaceTabObject;
  queryHistoryIndexes: number[];
  pipeline: Document[];
  scopedModals: any[];
  sourceName: string;
  editViewName: string;
  sourceReadonly?: boolean;
  sourceViewOn?: string;
  localAppRegistry: AppRegistry;
}

/**
 * The initial state.
 */
export const INITIAL_STATE = [];

type TabsState = WorkspaceTabObject[];

const showCollectionSubmenu = ({ isReadOnly }: { isReadOnly: boolean }) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { ipcRenderer } = require('hadron-ipc');

  if (ipcRenderer) {
    ipcRenderer.call('window:show-collection-submenu', {
      isReadOnly,
    });
  }
};

/**
 * Clear all the tabs.
 */
const doClearTabs = () => {
  return INITIAL_STATE;
};

/**
 * Handles namespace selected actions.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doSelectNamespace = (state: TabsState, action: AnyAction) => {
  return state.reduce((newState: TabsState, tab: WorkspaceTabObject) => {
    if (tab.isActive) {
      const subTabIndex = action.editViewName ? 1 : 0;
      newState.push({
        id: action.id,
        namespace: action.namespace,
        isActive: true,
        activeSubTab: subTabIndex,
        activeSubTabName: action.context.tabs[subTabIndex],
        isReadonly: action.isReadonly,
        isTimeSeries: action.isTimeSeries,
        isClustered: action.isClustered,
        isFLE: action.isFLE,
        tabs: action.context.tabs,
        views: action.context.views,
        subtab: action.context.subtab,
        queryHistoryIndexes: action.context.queryHistoryIndexes,
        pipeline: action.context.sourcePipeline,
        scopedModals: action.context.scopedModals,
        sourceName: action.sourceName,
        editViewName: action.editViewName,
        sourceReadonly: action.sourceReadonly,
        sourceViewOn: action.sourceViewOn,
        localAppRegistry: action.context.localAppRegistry,
      });
    } else {
      newState.push({ ...tab });
    }
    return newState;
  }, []);
};

/**
 * Handle create tab actions.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doCreateTab = (state: TabsState, action: AnyAction) => {
  const newState = state.map((tab: WorkspaceTabObject) => {
    return { ...tab, isActive: false };
  });

  const subTabIndex = action.query
    ? 0
    : action.aggregation
    ? 1
    : action.editViewName
    ? 1
    : 0;

  newState.push({
    id: action.id,
    namespace: action.namespace,
    isActive: true,
    activeSubTab: subTabIndex,
    activeSubTabName: action.context.tabs[subTabIndex],
    isReadonly: action.isReadonly,
    isTimeSeries: action.isTimeSeries,
    isClustered: action.isClustered,
    isFLE: action.isFLE,
    tabs: action.context.tabs,
    views: action.context.views,
    subtab: action.context.subtab,
    queryHistoryIndexes: action.context.queryHistoryIndexes,
    scopedModals: action.context.scopedModals,
    sourceName: action.sourceName,
    pipeline: action.context.sourcePipeline,
    editViewName: action.editViewName,
    sourceReadonly: action.sourceReadonly,
    sourceViewOn: action.sourceViewOn,
    localAppRegistry: action.context.localAppRegistry,
  });
  return newState;
};

/**
 * Handle close tab actions.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doCloseTab = (state: TabsState, action: AnyAction) => {
  const closeIndex = action.index;
  const activeIndex = state.findIndex((tab: WorkspaceTabObject) => {
    return tab.isActive;
  });
  const numTabs = state.length;

  return state.reduce(
    (newState: TabsState, tab: WorkspaceTabObject, i: number) => {
      if (closeIndex !== i) {
        // We follow standard browser behavior with tabs on how we
        // handle which tab gets activated if we close the active tab.
        // If the active tab is the last tab, we activate the one before
        // it, otherwise we activate the next tab.
        if (activeIndex === closeIndex) {
          newState.push({
            ...tab,
            isActive: isTabAfterCloseActive(closeIndex, i, numTabs),
          });
        } else {
          newState.push({ ...tab });
        }
      }
      return newState;
    },
    []
  );
};

const doCollectionDropped = (state: TabsState, action: AnyAction) => {
  const tabs = state.filter((tab: WorkspaceTabObject) => {
    return tab.namespace !== action.namespace;
  });
  if (tabs.length > 0) {
    if (tabs.findIndex((tab: WorkspaceTabObject) => tab.isActive) < 0) {
      tabs[0].isActive = true;
    }
  }
  return tabs;
};

const doDatabaseDropped = (state: TabsState, action: AnyAction) => {
  const tabs = state.filter((tab: WorkspaceTabObject) => {
    const tabDbName = toNS(tab.namespace).database;
    return tabDbName !== action.name;
  });
  if (tabs.length > 0) {
    if (tabs.findIndex((tab: WorkspaceTabObject) => tab.isActive) < 0) {
      tabs[0].isActive = true;
    }
  }
  return tabs;
};

/**
 * Handle move tab actions.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doMoveTab = (state: TabsState, action: AnyAction) => {
  if (action.fromIndex === action.toIndex) return state;
  const newState = state.map((tab: WorkspaceTabObject) => ({ ...tab }));
  newState.splice(action.toIndex, 0, newState.splice(action.fromIndex, 1)[0]);
  return newState;
};

/**
 * Activate the next tab.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const doNextTab = (state: TabsState) => {
  const activeIndex = state.findIndex(
    (tab: WorkspaceTabObject) => tab.isActive
  );
  return state.map((tab: WorkspaceTabObject, i: number) => {
    return {
      ...tab,
      isActive: isTabAfterNextActive(activeIndex, i, state.length),
    };
  });
};

/**
 * Activate the prev tab.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const doPrevTab = (state: TabsState) => {
  const activeIndex = state.findIndex(
    (tab: WorkspaceTabObject) => tab.isActive
  );
  return state.map((tab: WorkspaceTabObject, i: number) => {
    return {
      ...tab,
      isActive: isTabAfterPrevActive(activeIndex, i, state.length),
    };
  });
};

/**
 * Handle select tab actions.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doSelectTab = (state: TabsState, action: AnyAction) => {
  return state.map((tab: WorkspaceTabObject, i: number) => {
    return { ...tab, isActive: action.index === i ? true : false };
  });
};

/**
 * Handle the changing of the active subtab for a collection tab.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
const doChangeActiveSubTab = (state: TabsState, action: AnyAction) => {
  return state.map((tab: WorkspaceTabObject) => {
    const subTab =
      action.id === tab.id ? action.activeSubTab : tab.activeSubTab;
    return {
      ...tab,
      activeSubTab: subTab,
      activeSubTabName: tab.tabs[subTab],
    };
  });
};

/**
 * The action to state modifier mappings.
 */
const MAPPINGS = {
  [SELECT_NAMESPACE]: doSelectNamespace,
  [CREATE_TAB]: doCreateTab,
  [CLOSE_TAB]: doCloseTab,
  [MOVE_TAB]: doMoveTab,
  [NEXT_TAB]: doNextTab,
  [PREV_TAB]: doPrevTab,
  [SELECT_TAB]: doSelectTab,
  [CHANGE_ACTIVE_SUB_TAB]: doChangeActiveSubTab,
  [CLEAR_TABS]: doClearTabs,
  [COLLECTION_DROPPED]: doCollectionDropped,
  [DATABASE_DROPPED]: doDatabaseDropped,
};

/**
 * Reducer function for handle state changes to the tabs.
 *
 * @param {String} state - The tabs state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction): any {
  const fn = MAPPINGS[action.type];
  return fn ? fn(state, action) : state;
}

/**
 * Action creator for create tab.
 *
 * @parma {Object} options
 * @property {String} options.id - The tab id.
 * @property {String} options.namespace - The namespace.
 * @property {Boolean} options.isReadonly - Is the collection readonly?
 * @property {String} options.sourceName - The source namespace.
 * @property {String} options.editViewName - The name of the view we are editing.
 * @property {Object} options.context - The tab context.
 * @property {Boolean} options.sourceReadonly
 * @property {String} options.sourceViewOn
 *
 * @returns {Object} The create tab action.
 */
export const createTab = ({
  id,
  namespace,
  isReadonly,
  isTimeSeries,
  isClustered,
  isFLE,
  sourceName,
  editViewName,
  context,
  sourceReadonly,
  sourceViewOn,
  query,
  aggregation,
}: Pick<
  WorkspaceTabObject,
  | 'id'
  | 'namespace'
  | 'isReadonly'
  | 'isTimeSeries'
  | 'isClustered'
  | 'isFLE'
  | 'sourceName'
  | 'editViewName'
  | 'sourceReadonly'
  | 'sourceViewOn'
> & {
  context: ContextProps;
  query?: any; // TODO(COMPASS-6162): type query.
  aggregation?: any; // TODO(COMPASS-6162): type aggregation.
}): AnyAction => ({
  type: CREATE_TAB,
  id,
  namespace,
  isReadonly: !!isReadonly,
  isTimeSeries: !!isTimeSeries,
  isClustered: !!isClustered,
  isFLE: !!isFLE,
  sourceName,
  editViewName,
  context,
  sourceReadonly,
  sourceViewOn,
  query,
  aggregation,
});

/**
 * Action creator for namespace selected.
 *
 * @param {String} id - The tab id.
 * @param {String} namespace - The namespace.
 * @param {Boolean} isReadonly - Is the collection readonly?
 * @param {Boolean} isTimeSeries - Is the collection time-series?
 * @param {Boolean} isClustered - Is the collection clustered?
 * @param {Boolean} isFLE - Is the collection FLE?
 * @param {String} sourceName - The source namespace.
 * @param {String} editViewName - The name of the view we are editing.
 * @param {Object} context - The tab context.
 * @param {Object} sourceReadonly
 * @param {Object} sourceViewOn
 *
 * @returns {Object} The namespace selected action.
 */
export const selectNamespace = ({
  id,
  namespace,
  isReadonly,
  isTimeSeries,
  isClustered,
  isFLE,
  sourceName,
  editViewName,
  context,
  sourceReadonly,
  sourceViewOn,
}: Pick<
  WorkspaceTabObject,
  | 'id'
  | 'namespace'
  | 'isReadonly'
  | 'isTimeSeries'
  | 'isClustered'
  | 'isFLE'
  | 'sourceName'
  | 'editViewName'
  | 'sourceReadonly'
  | 'sourceViewOn'
> & {
  context: ContextProps;
}): AnyAction => ({
  type: SELECT_NAMESPACE,
  id,
  namespace,
  isReadonly: !!isReadonly,
  isTimeSeries,
  isClustered,
  isFLE,
  sourceName,
  editViewName,
  context,
  sourceReadonly,
  sourceViewOn,
});

/**
 * Action creator for close tab.
 *
 * @param {Number} index - The tab index.
 *
 * @returns {Object} The close tab action.
 */
export const closeTab =
  (index: number) => (dispatch: Dispatch, getState: () => RootState) => {
    const { tabs } = getState();
    if (tabs.length === 1) {
      dispatch(appRegistryEmit('all-collection-tabs-closed'));
    }
    dispatch({ type: CLOSE_TAB, index: index });
  };

/**
 * Action creator for move tab.
 *
 * @param {Number} fromIndex - The from tab index.
 * @param {Number} toIndex - The to tab index.
 *
 * @returns {Object} The move tab action.
 */
export const moveTab = (
  fromIndex: number,
  toIndex: number
): {
  type: string;
  fromIndex: number;
  toIndex: number;
} => ({
  type: MOVE_TAB,
  fromIndex: fromIndex,
  toIndex: toIndex,
});

/**
 * Action creator for next tab.
 *
 * @returns {Object} The next tab action.
 */
export const nextTab = (): {
  type: string;
} => ({
  type: NEXT_TAB,
});

/**
 * Action creator for prev tab.
 *
 * @returns {Object} The prev tab action.
 */
export const prevTab = (): {
  type: string;
} => ({
  type: PREV_TAB,
});

/**
 * Action creator for selecting tabs.
 *
 * @param {Number} index - The tab index.
 *
 * @returns {Object} The action.
 */
export const selectTab = (
  index: number
): {
  type: string;
  index: number;
} => ({
  type: SELECT_TAB,
  index: index,
});

/**
 * Action creator for clearing tabs.
 *
 * @returns {Object} The action.
 */
export const clearTabs = (): {
  type: string;
} => ({
  type: CLEAR_TABS,
});

export const collectionDropped = (
  namespace: string
): {
  type: string;
  namespace: string;
} => ({
  type: COLLECTION_DROPPED,
  namespace: namespace,
});

export const databaseDropped = (
  name: string
): {
  type: string;
  name: string;
} => ({
  type: DATABASE_DROPPED,
  name: name,
});

/**
 * Action creator for changing subtabs.
 *
 * @param {Number} activeSubTab - The active subtab index.
 * @param {String} id - The tab id.
 *
 * @returns {Object} The action.
 */
export const changeActiveSubTab = (
  activeSubTab: number,
  id: string
): {
  type: string;
  activeSubTab: number;
  id: string;
} => ({
  type: CHANGE_ACTIVE_SUB_TAB,
  activeSubTab: activeSubTab,
  id: id,
});

/**
 * Checks if we need to select a namespace or actually create a new
 * tab, then dispatches the correct events.
 *
 * @param {CollectionTabOptions} options
 */
export const selectOrCreateTab = ({
  namespace,
  isReadonly,
  isTimeSeries,
  isClustered,
  isFLE,
  sourceName,
  editViewName,
  sourceReadonly,
  sourceViewOn,
  sourcePipeline,
}: Pick<
  WorkspaceTabObject,
  | 'namespace'
  | 'isReadonly'
  | 'isTimeSeries'
  | 'isClustered'
  | 'isFLE'
  | 'sourceName'
  | 'editViewName'
  | 'sourceReadonly'
  | 'sourceViewOn'
> & {
  sourcePipeline: Document[];
}): ThunkAction<void, RootState, void, AnyAction> => {
  return (
    dispatch: ThunkDispatch<RootState, void, AnyAction>,
    getState: () => RootState // TODO: RootState types.
  ) => {
    const state = getState();
    if (state.tabs.length === 0) {
      dispatch(
        createNewTab({
          namespace,
          isReadonly,
          isTimeSeries,
          isClustered,
          isFLE,
          sourceName,
          editViewName,
          sourceReadonly,
          sourceViewOn,
          sourcePipeline,
        })
      );
    } else {
      // If the namespace is equal to the active tab's namespace, then
      // there is no need to do anything.
      const activeIndex = state.tabs.findIndex(
        (tab: WorkspaceTabObject) => tab.isActive
      );
      const activeNamespace = state.tabs[activeIndex].namespace;
      if (namespace !== activeNamespace) {
        dispatch(
          replaceTabContent({
            namespace,
            isReadonly,
            isTimeSeries,
            isClustered,
            isFLE,
            sourceName,
            editViewName,
            sourceReadonly,
            sourceViewOn,
            sourcePipeline,
          })
        );
      }
    }
  };
};

/**
 * Handles all the setup of tab creation by creating the stores for each
 * of the roles in the global app registry.
 *
 * @param {CollectionTabOptions} options
 */
export const createNewTab = ({
  namespace,
  isReadonly,
  isTimeSeries,
  isClustered,
  isFLE,
  sourceName,
  editViewName,
  sourceReadonly,
  sourceViewOn,
  sourcePipeline,
  query,
  aggregation,
}: Pick<
  WorkspaceTabObject,
  | 'namespace'
  | 'isReadonly'
  | 'isTimeSeries'
  | 'isClustered'
  | 'isFLE'
  | 'sourceName'
  | 'editViewName'
  | 'sourceReadonly'
  | 'sourceViewOn'
> & {
  sourcePipeline?: Document[];
  query?: any; // TODO(COMPASS-6162): type query.
  aggregation?: any; // TODO(COMPASS-6162): type aggregation.
}): ThunkAction<void, RootState, void, AnyAction> => {
  return (dispatch: Dispatch, getState: () => RootState) => {
    const state = getState();
    const context = createContext({
      state,
      namespace,
      isReadonly,
      isDataLake: state.isDataLake,
      isTimeSeries,
      isClustered,
      isFLE,
      sourceName,
      editViewName,
      sourcePipeline,
      query,
      aggregation,
    });
    dispatch(
      createTab({
        id: new ObjectId().toHexString(),
        namespace,
        isReadonly,
        isTimeSeries,
        isClustered,
        isFLE,
        sourceName,
        editViewName,
        context,
        sourceReadonly: !!sourceReadonly,
        sourceViewOn,
        query,
        aggregation,
      })
    );
    showCollectionSubmenu({ isReadOnly: isReadonly });
  };
};

/**
 * Handles all the setup of replacing tab content by creating the stores for each
 * of the roles in the global app registry.
 *
 * @param {CollectionTabOptions} options
 */
export const replaceTabContent = ({
  namespace,
  isReadonly,
  isTimeSeries,
  isClustered,
  isFLE,
  sourceName,
  editViewName,
  sourceReadonly,
  sourceViewOn,
  sourcePipeline,
}: Pick<
  WorkspaceTabObject,
  | 'namespace'
  | 'isReadonly'
  | 'isTimeSeries'
  | 'isClustered'
  | 'isFLE'
  | 'sourceName'
  | 'editViewName'
  | 'sourceReadonly'
  | 'sourceViewOn'
> & {
  sourcePipeline?: Document[];
}): ThunkAction<void, RootState, void, AnyAction> => {
  return (dispatch: Dispatch, getState: any) => {
    const state = getState();
    const context = createContext({
      state,
      namespace,
      isReadonly,
      isDataLake: state.isDataLake,
      isTimeSeries,
      isClustered,
      isFLE,
      sourceName,
      editViewName,
      sourcePipeline,
    });
    dispatch(
      selectNamespace({
        id: new ObjectId().toHexString(),
        namespace,
        isReadonly,
        isTimeSeries,
        isClustered,
        isFLE,
        sourceName,
        editViewName,
        context,
        sourceReadonly: !!sourceReadonly,
        sourceViewOn,
      })
    );
    showCollectionSubmenu({ isReadOnly: isReadonly });
  };
};

/**
 * Determine if a tab is active after the prev action.
 *
 * @param {Number} activeIndex - The current active tab index.
 * @param {Number} currentIndex - The currently iterated tab index.
 * @param {Number} numTabs - The total number of tabs.
 *
 * @returns {Boolean} If the tab is active.
 */
const isTabAfterPrevActive = (
  activeIndex: number,
  currentIndex: number,
  numTabs: number
) => {
  return activeIndex === 0
    ? currentIndex === numTabs - 1
    : currentIndex === activeIndex - 1;
};

/**
 * Determine if a tab becomes active after an active tab
 * is closed.
 *
 * @param {Number} closeIndex - The index of the tab being closed.
 * @param {Number} currentIndex - The current tab index.
 * @param {Number} numTabs - The number of tabs.
 *
 * @returns {Boolean} If the tab must be active.
 */
const isTabAfterCloseActive = (
  closeIndex: number,
  currentIndex: number,
  numTabs: number
) => {
  return closeIndex === numTabs - 1
    ? currentIndex === numTabs - 2
    : currentIndex === closeIndex + 1;
};

/**
 * Determine if a tab is active after the next action.
 *
 * @param {Number} activeIndex - The current active tab index.
 * @param {Number} currentIndex - The currently iterated tab index.
 * @param {Number} numTabs - The total number of tabs.
 *
 * @returns {Boolean} If the tab is active.
 */
const isTabAfterNextActive = (
  activeIndex: number,
  currentIndex: number,
  numTabs: number
) => {
  return activeIndex === numTabs - 1
    ? currentIndex === 0
    : currentIndex === activeIndex + 1;
};
