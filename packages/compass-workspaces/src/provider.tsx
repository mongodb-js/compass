import React, { useContext, useRef } from 'react';
import { useSelector, useStore } from './stores/context';
import type {
  OpenWorkspaceOptions,
  TabOptions,
  WorkspaceTab,
} from './stores/workspaces';
import {
  getActiveTab,
  openWorkspace as openWorkspaceAction,
} from './stores/workspaces';
import { createServiceLocator } from 'hadron-app-registry';

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
   * Open "Databases" workspace showing list of all databases in the cluster
   */
  openDatabasesWorkspace(this: void, tabOptions?: TabOptions): void;
  /**
   * Open "Performance" workspace showing charts of various cluster performance
   * metrics
   */
  openPerformanceWorkspace(this: void, tabOptions?: TabOptions): void;
  /**
   * Open "Collections" workspace showing list of collections for a certain
   * database namespace
   */
  openCollectionsWorkspace(
    this: void,
    namespace: string,
    tabOptions?: TabOptions
  ): void;
  /**
   * Open "Collection" workspace showing various features to interact with a
   * collection for a certain namespace
   */
  openCollectionWorkspace(
    this: void,
    namespace: string,
    options?: TabOptions &
      Omit<
        Extract<OpenWorkspaceOptions, { type: 'Collection' }>,
        'type' | 'namespace' | 'editViewName' | 'subTab'
      >
  ): void;
  /**
   * Open "Collection" workspace for a view namespace in a specially handled
   * "Editing view" state
   */
  openEditViewWorkspace(
    this: void,
    viewNamespace: string,
    options: { sourceName: string; sourcePipeline: unknown[] } & TabOptions
  ): void;
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
  openDatabasesWorkspace: throwIfNotTestEnv,
  openPerformanceWorkspace: throwIfNotTestEnv,
  openCollectionsWorkspace: throwIfNotTestEnv,
  openCollectionWorkspace: throwIfNotTestEnv,
  openEditViewWorkspace: throwIfNotTestEnv,
  [kSelector]() {
    throwIfNotTestEnv();
    return null;
  },
};

const WorkspacesServiceContext = React.createContext<WorkspacesService>(
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
    const service = useRef<WorkspacesService>({
      getActiveWorkspace: () => {
        return getActiveTab(store.getState());
      },
      openMyQueriesWorkspace: (tabOptions) => {
        return store.dispatch(
          openWorkspaceAction({ type: 'My Queries' }, tabOptions)
        );
      },
      openDatabasesWorkspace: (tabOptions) => {
        return store.dispatch(
          openWorkspaceAction({ type: 'Databases' }, tabOptions)
        );
      },
      openPerformanceWorkspace: (tabOptions) => {
        return store.dispatch(
          openWorkspaceAction({ type: 'Performance' }, tabOptions)
        );
      },
      openCollectionsWorkspace: (namespace, tabOptions) => {
        return store.dispatch(
          openWorkspaceAction({ type: 'Collections', namespace }, tabOptions)
        );
      },
      openCollectionWorkspace: (namespace, options) => {
        const isAggregationsSubtab = Boolean(
          options?.initialAggregation ||
            options?.initialPipeline ||
            options?.initialPipelineText
        );
        const { newTab, ...collectionOptions } = options ?? {};
        return store.dispatch(
          openWorkspaceAction(
            {
              type: 'Collection',
              subTab: isAggregationsSubtab ? 'Aggregations' : 'Documents',
              namespace,
              ...collectionOptions,
            },
            { newTab }
          )
        );
      },
      openEditViewWorkspace: (viewNamespace, options) => {
        const { newTab, sourceName, sourcePipeline } = options ?? {};
        return store.dispatch(
          openWorkspaceAction(
            {
              type: 'Collection',
              namespace: sourceName,
              initialPipeline: sourcePipeline,
              editViewName: viewNamespace,
              subTab: 'Aggregations',
            },
            { newTab }
          )
        );
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

function useWorkspacesService() {
  const service = useContext(WorkspacesServiceContext);
  if (!service) {
    throw new Error(
      "Can't find Workspaces service in React context. Make sure you are using workspaces service and hooks inside Workspaces scope"
    );
  }
  return service;
}

export function useOpenWorkspace() {
  const {
    openCollectionWorkspace,
    openCollectionsWorkspace,
    openDatabasesWorkspace,
    openMyQueriesWorkspace,
    openPerformanceWorkspace,
    openEditViewWorkspace,
  } = useWorkspacesService();

  const openFns = useRef({
    openCollectionWorkspace,
    openCollectionsWorkspace,
    openDatabasesWorkspace,
    openMyQueriesWorkspace,
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
  useWorkspacesService,
  'workspacesServiceLocator'
);

export { useWorkspacePlugins } from './components/workspaces-provider';
export { useTabState } from './components/workspace-tab-state-provider';
