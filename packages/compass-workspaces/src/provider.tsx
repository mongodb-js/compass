import React, { useContext, useRef } from 'react';
import { useSelector, useStore } from './stores/context';
import type {
  OpenWorkspaceOptions,
  TabOptions,
  WorkspacesState,
} from './stores/workspaces';
import {
  collectionSubtabSelected,
  getActiveTab,
  openWorkspace as openWorkspaceAction,
} from './stores/workspaces';
import { createServiceLocator } from '@mongodb-js/compass-app-registry';
import type { CollectionSubtab, WorkspaceTab } from './types';
import type { WorkspaceDestroyHandler } from './components/workspace-close-handler';
import { useRegisterTabDestroyHandler } from './components/workspace-close-handler';
import type { WorkspacesStateData } from './services/workspaces-storage';

function useWorkspacesStore() {
  try {
    return useStore();
  } catch {
    throw new Error(
      "Can't find Workspaces store in React context. Make sure you are using workspaces service and hooks inside Workspaces scope"
    );
  }
}

function useActiveWorkspaceSelector() {
  return useSelector(getActiveTab);
}

const kSelector = Symbol('useActiveWorkspaceSelector');

export type WorkspacesService = {
  /**
   * Get current active workspace tab
   */
  getActiveWorkspace(this: void): WorkspaceTab | null;
  /**
   * Open "My Queries" workspace showing a list of aggregations and queries
   * saved by the user
   */
  openMyQueriesWorkspace(this: void, tabOptions?: TabOptions): void;

  /**
   * Open "Data Modeling" workspace
   */
  openDataModelingWorkspace(this: void): void;

  /**
   * Open "Shell" workspace
   */
  openShellWorkspace(
    this: void,
    connectionId: string,
    options?: TabOptions &
      Pick<
        Extract<OpenWorkspaceOptions, { type: 'Shell' }>,
        'initialInput' | 'initialEvaluate'
      >
  ): void;
  /**
   * Open "Databases" workspace showing list of all databases in the cluster
   */
  openDatabasesWorkspace(
    this: void,
    connectionId: string,
    tabOptions?: TabOptions
  ): void;
  /**
   * Open "Performance" workspace showing charts of various cluster performance
   * metrics
   */
  openPerformanceWorkspace(
    this: void,
    connectionId: string,
    tabOptions?: TabOptions
  ): void;
  /**
   * Open "Collections" workspace showing list of collections for a certain
   * database namespace
   */
  openCollectionsWorkspace(
    this: void,
    connectionId: string,
    namespace: string,
    tabOptions?: TabOptions
  ): void;
  /**
   * Open "Collection" workspace showing various features to interact with a
   * collection for a certain namespace
   */
  openCollectionWorkspace(
    this: void,
    connectionId: string,
    namespace: string,
    options?: TabOptions &
      Omit<
        Extract<OpenWorkspaceOptions, { type: 'Collection' }>,
        'type' | 'namespace' | 'editViewName' | 'connectionId'
      >
  ): void;
  /**
   * Open subTab in "Collection" workspace
   */
  openCollectionWorkspaceSubtab(
    this: void,
    tabId: string,
    subtab: CollectionSubtab
  ): void;
  /**
   * Open "Collection" workspace for a view namespace in a specially handled
   * "Editing view" state
   */
  openEditViewWorkspace(
    this: void,
    connectionId: string,
    viewNamespace: string,
    options: { sourceName: string; sourcePipeline: unknown[] } & TabOptions
  ): void;
  /**
   * A method that registers a tab close handler. Before closing the tab, this
   * handler will be called and can return either `true` to allow the tab to be
   * closed, or `false`, preventing tab to be closed before user confirms the
   * tab closure.
   *
   * Multiple handlers can be registered for one tab, they will be called in
   * order of registration and any one of them returning `false` will prevent
   * the tab from closing.
   *
   * Method might be undefined when using workspace service outside of workspace
   * tab context.
   *
   * @returns A clean-up method that will un-register the handler
   *
   * @example
   * function activatePlugin(
   *   initialProps,
   *   { workspaces },
   *   { addCleanup, cleanup }
   * ) {
   *   const store = createStore();
   *
   *   addCleanup(workspaces.onTabClose?.(() => {
   *     return store.getState().modified === false;
   *   }));
   *
   *   return { store, deactivate: cleanup }
   * }
   */
  onTabClose?: (handler: WorkspaceDestroyHandler) => () => void;
  /**
   *
   * A method that registers a tab replace handler. By default when opening a new
   * workspace, it will be opened in the same tab, destroying the content of the
   * current workspace. In that case, the registered handler can return either
   * `true` to allow the workspace to be destroyed, or `false` to prevent the
   * tab from being destroyed and forcing the new workspace to open in the new
   * tab.
   *
   * Multiple handlers can be registered for one tab, they will be called in
   * order of registration and any one of them returning `false` will prevent
   * the tab from being replaced.
   *
   * Method might be undefined when using workspace service outside of workspace
   * tab context.
   *
   * @returns A clean-up method that will un-register the handler
   *
   * @example
   * function activatePlugin(
   *   initialProps,
   *   { workspaces },
   *   { addCleanup, cleanup }
   * ) {
   *   const store = createStore();
   *
   *   addCleanup(workspaces.onTabReplace?.(() => {
   *     return store.getState().modified === false;
   *   }));
   *
   *   return { store, deactivate: cleanup }
   * }
   */
  onTabReplace?: (handler: WorkspaceDestroyHandler) => () => void;

  saveWorkspaces(): Promise<boolean>;

  loadSavedWorkspaces(): Promise<OpenWorkspaceOptions[] | null>;
};

// Separate type to avoid exposing internal prop in exported types
type WorkspacesServiceImpl = WorkspacesService & {
  /**
   * useActiveWorkspace hook, exposed through the service interface so that it
   * can be mocked in the test environment
   * @internal
   */
  [kSelector]?: typeof useActiveWorkspaceSelector | undefined;
};

const throwIfNotTestEnv = () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      "Can't find Workspaces service in React context. Make sure you are using workspaces service and hooks inside Workspaces scope"
    );
  }
};

const noopWorkspacesService = {
  getActiveWorkspace() {
    throwIfNotTestEnv();
    return null;
  },
  openMyQueriesWorkspace: throwIfNotTestEnv,
  openDataModelingWorkspace: throwIfNotTestEnv,
  openShellWorkspace: throwIfNotTestEnv,
  openDatabasesWorkspace: throwIfNotTestEnv,
  openPerformanceWorkspace: throwIfNotTestEnv,
  openCollectionsWorkspace: throwIfNotTestEnv,
  openCollectionWorkspaceSubtab: throwIfNotTestEnv,
  openCollectionWorkspace: throwIfNotTestEnv,
  openEditViewWorkspace: throwIfNotTestEnv,
  [kSelector]() {
    throwIfNotTestEnv();
    return null;
  },
  saveWorkspaces: async () => {
    throwIfNotTestEnv();
    return Promise.reject();
  },
  loadSavedWorkspaces: async () => {
    throwIfNotTestEnv();
    return Promise.reject();
  },
};

const WorkspacesServiceContext = React.createContext<WorkspacesServiceImpl>(
  noopWorkspacesService
);

export const WorkspacesServiceProvider: React.FunctionComponent<{
  value?: WorkspacesService;
}> = ({ value, children }) => {
  // We're breaking React rules of hooks here, but this is unavoidable to allow
  // for testing components using this service. In reality this will never be a
  // conditional call to hooks: either the tests will be providing a mock
  // service for all renders, or not and we will call hooks that are setting up
  // the service from actual store
  /* eslint-disable react-hooks/rules-of-hooks */
  value ??= (() => {
    const store = useWorkspacesStore();
    const service = useRef<WorkspacesServiceImpl>({
      getActiveWorkspace: () => {
        return getActiveTab(store.getState());
      },
      openMyQueriesWorkspace: (tabOptions) => {
        return void store.dispatch(
          openWorkspaceAction({ type: 'My Queries' }, tabOptions)
        );
      },
      openDataModelingWorkspace: () => {
        return void store.dispatch(
          openWorkspaceAction(
            { type: 'Data Modeling' },
            {
              // Data Modeling tab is a special case, we always want to open it
              // in a new tab to make it easier for users to create / open new
              // diagrams
              newTab: true,
            }
          )
        );
      },
      openShellWorkspace(connectionId, options = {}) {
        const { newTab, ...workspaceOptions } = options;
        return void store.dispatch(
          openWorkspaceAction(
            { type: 'Shell', connectionId, ...workspaceOptions },
            { newTab }
          )
        );
      },
      openDatabasesWorkspace: (connectionId, tabOptions) => {
        return void store.dispatch(
          openWorkspaceAction({ type: 'Databases', connectionId }, tabOptions)
        );
      },
      openPerformanceWorkspace: (connectionId, tabOptions) => {
        return void store.dispatch(
          openWorkspaceAction({ type: 'Performance', connectionId }, tabOptions)
        );
      },
      openCollectionsWorkspace: (connectionId, namespace, tabOptions) => {
        return void store.dispatch(
          openWorkspaceAction(
            { type: 'Collections', connectionId, namespace },
            tabOptions
          )
        );
      },
      openCollectionWorkspace: (connectionId, namespace, options) => {
        const { newTab, ...collectionOptions } = options ?? {};
        return void store.dispatch(
          openWorkspaceAction(
            {
              type: 'Collection',
              connectionId,
              namespace,
              ...collectionOptions,
            },
            { newTab }
          )
        );
      },
      openCollectionWorkspaceSubtab(tabId, subtab) {
        store.dispatch(collectionSubtabSelected(tabId, subtab));
      },
      openEditViewWorkspace: (connectionId, viewNamespace, options) => {
        const { newTab, sourceName, sourcePipeline } = options ?? {};
        return void store.dispatch(
          openWorkspaceAction(
            {
              type: 'Collection',
              connectionId,
              namespace: sourceName,
              initialPipeline: sourcePipeline,
              editViewName: viewNamespace,
            },
            { newTab }
          )
        );
      },
      async saveWorkspaces() {
        const state = store.getState();
        return await saveWorkspaceStateToUserData(state);
      },
      async loadSavedWorkspaces() {
        const state = store.getState();
        if (!state.userData) {
          throw new Error('UserData is not initialized in the store');
        }
        const savedState = await state.userData.readOne('current-workspace', {
          ignoreErrors: true,
        });
        if (!savedState) {
          return null;
        }
        return convertSavedStateToOpenWorkspaceOptions(savedState);
      },
      [kSelector]: useActiveWorkspaceSelector,
    });
    return service.current;
  })();
  /* eslint-enable react-hooks/rules-of-hooks */

  return (
    <WorkspacesServiceContext.Provider value={value}>
      {children}
    </WorkspacesServiceContext.Provider>
  );
};

/**
 * Converts saved workspace state data back to OpenWorkspaceOptions format
 * for initializing the store
 */
function convertSavedStateToOpenWorkspaceOptions(
  savedState: WorkspacesStateData
): OpenWorkspaceOptions[] {
  return savedState.tabs.map((tab) => {
    const baseTab: Record<string, unknown> = { type: tab.type };

    // Add connection-related fields
    if (tab.connectionId) {
      baseTab.connectionId = tab.connectionId;
    }
    if (tab.namespace) {
      baseTab.namespace = tab.namespace;
    }

    // Add optional fields based on workspace type
    if (tab.initialQuery) {
      baseTab.initialQuery = tab.initialQuery;
    }
    if (tab.initialAggregation) {
      baseTab.initialAggregation = tab.initialAggregation;
    }
    if (tab.initialPipeline) {
      baseTab.initialPipeline = tab.initialPipeline;
    }
    if (tab.initialPipelineText) {
      baseTab.initialPipelineText = tab.initialPipelineText;
    }
    if (tab.editViewName) {
      baseTab.editViewName = tab.editViewName;
    }
    if (tab.initialEvaluate) {
      baseTab.initialEvaluate = tab.initialEvaluate;
    }
    if (tab.initialInput) {
      baseTab.initialInput = tab.initialInput;
    }
    if (tab.subTab) {
      baseTab.initialSubtab = tab.subTab;
    }

    return baseTab as OpenWorkspaceOptions;
  });
}

async function saveWorkspaceStateToUserData(state: WorkspacesState) {
  const userData = state.userData;
  if (!userData) {
    throw new Error('UserData is not initialized in the store');
  }
  try {
    // Transform the state to the format we want to save
    const stateToSave: WorkspacesStateData = {
      tabs: state.tabs.map((tab) => {
        const baseTab = {
          id: tab.id,
          type: tab.type,
        };

        // Add optional fields conditionally
        const result: WorkspacesStateData['tabs'][0] = { ...baseTab };

        if ('connectionId' in tab && tab.connectionId) {
          result.connectionId = tab.connectionId;
        }
        if ('namespace' in tab && tab.namespace) {
          result.namespace = tab.namespace;
        }
        if ('initialQuery' in tab && tab.initialQuery) {
          // Store as record, accepting unknown format
          result.initialQuery = tab.initialQuery as Record<string, unknown>;
        }
        if ('initialAggregation' in tab && tab.initialAggregation) {
          result.initialAggregation = tab.initialAggregation as Record<
            string,
            unknown
          >;
        }
        if ('initialPipeline' in tab && tab.initialPipeline) {
          result.initialPipeline = tab.initialPipeline as Array<
            Record<string, unknown>
          >;
        }
        if ('initialPipelineText' in tab && tab.initialPipelineText) {
          result.initialPipelineText = tab.initialPipelineText;
        }
        if ('editViewName' in tab && tab.editViewName) {
          result.editViewName = tab.editViewName;
        }
        if ('initialEvaluate' in tab && tab.initialEvaluate) {
          result.initialEvaluate = tab.initialEvaluate;
        }
        if ('initialInput' in tab && tab.initialInput) {
          result.initialInput = tab.initialInput;
        }
        if ('subTab' in tab && tab.subTab) {
          // Validate that subTab is one of the allowed values
          const validSubTabs = [
            'Documents',
            'Aggregations',
            'Schema',
            'Indexes',
            'Validation',
            'GlobalWrites',
          ];
          if (validSubTabs.includes(tab.subTab as string)) {
            result.subTab = tab.subTab as
              | 'Documents'
              | 'Aggregations'
              | 'Schema'
              | 'Indexes'
              | 'Validation'
              | 'GlobalWrites';
          }
        }

        return result;
      }),
      activeTabId: state.activeTabId,
      timestamp: Date.now(),
    };

    // Save to UserData with a fixed ID
    return await userData.write('current-workspace', stateToSave);

    // Optional: Log for debugging in development
    // if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    // console.log('Workspace state saved to UserData:', {
    //   actionType: action.type,
    //   tabCount: state.tabs.length,
    //   activeTabId: state.activeTabId,
    //   timestamp: new Date().toISOString(),
    // });
    // }
  } catch (error) {
    // Don't throw errors from the middleware to avoid breaking the app
    // eslint-disable-next-line no-console
    console.error('Failed to save workspace state to UserData:', error);

    throw error;
  }
}

export function useLoadWorkspacesRef() {
  const service = useContext(WorkspacesServiceContext);

  // TODO: do we need to bind this to service?
  const loadWorkspaces = useRef(service.loadSavedWorkspaces());

  return loadWorkspaces;
}

function useWorkspacesService() {
  const service = useContext(WorkspacesServiceContext);
  if (!service) {
    throw new Error(
      "Can't find Workspaces service in React context. Make sure you are using workspaces service and hooks inside Workspaces scope"
    );
  }
  const handlers = useRegisterTabDestroyHandler();
  return { ...service, ...handlers };
}

export function useOpenWorkspace() {
  const {
    openShellWorkspace,
    openCollectionWorkspace,
    openCollectionsWorkspace,
    openDatabasesWorkspace,
    openMyQueriesWorkspace,
    openDataModelingWorkspace,
    openPerformanceWorkspace,
    openEditViewWorkspace,
  } = useWorkspacesService();

  const openFns = useRef({
    openShellWorkspace,
    openCollectionWorkspace,
    openCollectionsWorkspace,
    openDatabasesWorkspace,
    openMyQueriesWorkspace,
    openDataModelingWorkspace,
    openPerformanceWorkspace,
    openEditViewWorkspace,
  });

  return openFns.current;
}

export function useActiveWorkspace() {
  const service = useWorkspacesService();
  // We call useSelector to create a subscription to the state update ...
  service[kSelector]?.();
  // ... but return the value from the service so that it can be mocked in tests
  // if needed
  return service.getActiveWorkspace();
}

export const workspacesServiceLocator = createServiceLocator(
  useWorkspacesService as () => WorkspacesService,
  'workspacesServiceLocator'
);

export { useWorkspacePlugins } from './components/workspaces-provider';
export {
  useWorkspaceTabId,
  useTabState,
} from './components/workspace-tab-state-provider';
export {
  useOnTabClose,
  useOnTabReplace,
} from './components/workspace-close-handler';
