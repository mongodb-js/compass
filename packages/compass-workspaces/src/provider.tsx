import React, { useCallback, useContext, useMemo } from 'react';
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
        'type' | 'namespace'
      >
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
    const getActiveWorkspace = useCallback(() => {
      return getActiveTab(store.getState());
    }, [store]);
    const openMyQueriesWorkspace: WorkspacesService['openMyQueriesWorkspace'] =
      useCallback(
        (tabOptions) => {
          return store.dispatch(
            openWorkspaceAction({ type: 'My Queries' }, tabOptions)
          );
        },
        [store]
      );
    const openDatabasesWorkspace: WorkspacesService['openDatabasesWorkspace'] =
      useCallback(
        (tabOptions) => {
          return store.dispatch(
            openWorkspaceAction({ type: 'Databases' }, tabOptions)
          );
        },
        [store]
      );
    const openPerformanceWorkspace: WorkspacesService['openPerformanceWorkspace'] =
      useCallback(
        (tabOptions) => {
          return store.dispatch(
            openWorkspaceAction({ type: 'Performance' }, tabOptions)
          );
        },
        [store]
      );
    const openCollectionsWorkspace: WorkspacesService['openCollectionsWorkspace'] =
      useCallback(
        (namespace, tabOptions) => {
          return store.dispatch(
            openWorkspaceAction({ type: 'Collections', namespace }, tabOptions)
          );
        },
        [store]
      );
    const openCollectionWorkspace: WorkspacesService['openCollectionWorkspace'] =
      useCallback(
        (namespace, options) => {
          const { newTab, ...collectionOptions } = options ?? {};
          return store.dispatch(
            openWorkspaceAction(
              { type: 'Collection', namespace, ...collectionOptions },
              { newTab }
            )
          );
        },
        [store]
      );
    return useMemo(() => {
      return {
        getActiveWorkspace,
        openMyQueriesWorkspace,
        openDatabasesWorkspace,
        openPerformanceWorkspace,
        openCollectionsWorkspace,
        openCollectionWorkspace,
        [kSelector]: useActiveWorkspaceSelector,
      };
    }, [
      getActiveWorkspace,
      openMyQueriesWorkspace,
      openDatabasesWorkspace,
      openPerformanceWorkspace,
      openCollectionsWorkspace,
      openCollectionWorkspace,
    ]);
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
  } = useWorkspacesService();

  return useMemo(() => {
    return {
      openCollectionWorkspace,
      openCollectionsWorkspace,
      openDatabasesWorkspace,
      openMyQueriesWorkspace,
      openPerformanceWorkspace,
    };
  }, [
    openCollectionWorkspace,
    openCollectionsWorkspace,
    openDatabasesWorkspace,
    openMyQueriesWorkspace,
    openPerformanceWorkspace,
  ]);
}

export function useActiveWorkspace() {
  const service = useWorkspacesService();
  // We call useSelector to create a subscription to the state update ...
  service[kSelector]?.();
  // ... but return the value from the service so that it can be mocked in tests
  // if needed
  return service.getActiveWorkspace();
}

export const workspacesServiceLocator = useWorkspacesService;
